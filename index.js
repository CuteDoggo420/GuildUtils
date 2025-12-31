import config from "./config.js"

function getApiBase() {
    return config.DcustomApiServer && config.DcustomApiServer.length > 0
        ? config.DcustomApiServer
        : "https://api.guildutils.buzz/player";
}

function getMinLevel() {
    return config.SminLevel && config.SminLevel.length > 0 ? parseInt(config.SminLevel) : 0;
}
function hasMinLevel() {
    return config.SminLevel && config.SminLevel.length > 0;
}

function getMinCata() {
    return config.SminCata && config.SminCata.length > 0 ? parseFloat(config.SminCata) : 0;
}
function hasMinCata() {
    return config.SminCata && config.SminCata.length > 0;
}

function parseNetworthInput(str) {
    if (!str || String(str).trim() === "") return 0;
    const s = String(str).trim().toLowerCase();
    const last = s[s.length - 1];
    let num = parseFloat(s.replace(/,/g, ""));
    if (Number.isNaN(num)) return 0;
    if (last === "b") return num * 1e9;
    if (last === "m") return num * 1e6;
    if (last === "k") return num * 1e3;
    return num;
}
function getMinNw() {
    return parseNetworthInput(config.SminNw);
}
function hasMinNw() {
    return config.SminNw && config.SminNw.length > 0;
}

function formatNwSuffix(n) {
    if (n === null || n === undefined) return "0";
    n = Number(n) || 0;
    if (n >= 1e9) {
        const v = (n / 1e9);
        return (Math.round(v * 100) / 100).toString().replace(/\.0$/, "") + "b";
    }
    if (n >= 1e6) {
        const v = (n / 1e6);
        return (Math.round(v * 100) / 100).toString().replace(/\.0$/, "") + "m";
    }
    if (n >= 1e3) {
        const v = (n / 1e3);
        return (Math.round(v * 100) / 100).toString().replace(/\.0$/, "") + "k";
    }
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function shouldReplyIfGuilded() {
    return !!config.SreplyIfGuilded;
}

function shouldCleanGuildMessages() {
    return !!config.ScleanGuildMessages;
}

function shouldSuppressErrors() {
    return config.DsupressErrors !== false;
}

function shouldShowPlayer(guildInfo) {
    if (guildInfo && guildInfo.inGuild && !shouldReplyIfGuilded()) return false;
    return true;
}

function httpGet(urlStr) {
    const URL = Java.type("java.net.URL");
    const BufferedReader = Java.type("java.io.BufferedReader");
    const InputStreamReader = Java.type("java.io.InputStreamReader");
    const url = new URL(urlStr);
    const conn = url.openConnection();
    conn.setRequestMethod("GET");
    conn.setConnectTimeout(8000);
    conn.setReadTimeout(8000);
    conn.setRequestProperty("User-Agent", "GuildUtils/1.8.9");
    let stream;
    try {
        stream = conn.getInputStream();
    } catch (e) {
        stream = conn.getErrorStream();
        if (!stream) throw e;
    }
    const reader = new BufferedReader(new InputStreamReader(stream));
    let response = "";
    let line;
    while ((line = reader.readLine()) !== null) {
        response += line;
    }
    reader.close();
    return response;
}

const hypixelColorToCode = {
    DARK_GREEN: "2", GREEN: "a", DARK_AQUA: "3", AQUA: "b", DARK_BLUE: "1", BLUE: "9", DARK_RED: "4", RED: "c", DARK_PURPLE: "5", LIGHT_PURPLE: "d", GOLD: "6", YELLOW: "e", WHITE: "f", GRAY: "7", DARK_GRAY: "8", BLACK: "0", NONE: "9"
};
function getLevelColor(level) {
    if (level <= 40) return "&7";
    if (level <= 80) return "&f";
    if (level <= 120) return "&e";
    if (level <= 160) return "&a";
    if (level <= 200) return "&2";
    if (level <= 240) return "&b";
    if (level <= 280) return "&3";
    if (level <= 320) return "&9";
    if (level <= 360) return "&d";
    if (level <= 400) return "&5";
    if (level <= 440) return "&6";
    if (level <= 480) return "&c";
    return "&4";
}
function getTagColorCode(colorName) {
    if (!colorName) return "7";
    const code = hypixelColorToCode[String(colorName).toUpperCase()];
    return code || "7";
}
function formatGexp(xp) {
    if (!xp) return "0";
    return xp.toLocaleString();
}
function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    if (typeof n === "number" && !Number.isFinite(n)) return "0";
    try {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (e) { return String(n); }
}

function formatGexpShort(n) {
    if (n === null || n === undefined) return "0";
    n = Number(n) || 0;
    if (n >= 1e3) return (Math.round((n / 1e3) * 100) / 100) + "k";
    return Math.round(n).toString();
}


function handleError(msg, err) {
    if (shouldSuppressErrors()) {
        ChatLib.chat(`&e[&dGuildUtils&e]&c ${msg}`);
    } else {
        ChatLib.chat(`&c[&dGuildUtils&e]&c ${msg} &7(${err})`);
    }
}

let apiCooldownUntil = 0;
function handleTooManyRequests(waitMs) {
    apiCooldownUntil = Date.now() + waitMs;
}

function showHelp() {
    ChatLib.chat("&9&l---------------------------------------------");
    ChatLib.chat("&a/gu help &b- Show this help message");
    ChatLib.chat("&a/gu lobby &b- Info on all players in your lobby");
    ChatLib.chat("&a/gu player &e<name> &b- Info on a specific player");
    ChatLib.chat("&a/gu settings &b- Open settings");
    ChatLib.chat("&9&l---------------------------------------------");
}

function buildReplyMessage({ lvl, name, guildInfo, cataLevel, networth }) {
    const cataStr = cataLevel !== undefined && cataLevel !== null ? (typeof cataLevel === "number" ? cataLevel.toFixed(2) : String(cataLevel)) : "N/A";
    const nwStr = networth !== undefined && networth !== null ? formatNwSuffix(networth) : "0";

    if (!guildInfo || !guildInfo.inGuild) {
        return new Message(
            new TextComponent(`&8[${getLevelColor(lvl)}${lvl}&8] &b${name} &6is not in a guild!`).setClick("run_command", `/p ${name}`)
                .setHoverValue(`&aLevel: &b${lvl}\n&aCata: &b${cataStr}\n&aNetworth: &b${nwStr}\n&aClick to party this player`)
        );
    }
    const tagColor = `&${getTagColorCode(guildInfo.guildTagColor)}`;
    const hover = [
        `&aGuild: ${tagColor}${guildInfo.guildName}`,
        `&aRank: &b${guildInfo.rank || "Member"}`,
        `&aLevel: &b${lvl}`,
        `&aCata: &b${cataStr}`,
        `&aNetworth: &b${nwStr}`,
        `&aDays in guild: &b${guildInfo.timeInGuild || "N/A"}`,
        `&aWeekly GEXP: &b${formatGexpShort(guildInfo.totalWeeklyGexp)}`,
        `&aGuild Size: &b${guildInfo.memberCount || 0}/125`,
        `&5(Click to Party)`
    ].join("\n");

    if (shouldCleanGuildMessages()) {
        return new Message(
            new TextComponent(`&8[${getLevelColor(lvl)}${lvl}&8] &b${name} ${tagColor}[${guildInfo.guildTag}] &7(${guildInfo.guildName})`).setClick("run_command", `/p ${name}`)
                .setHoverValue(hover)
        );
    } else {
        return new Message(
            new TextComponent(
                `&8[${getLevelColor(lvl)}${lvl}&8] &b${name} &7is in ${tagColor}${guildInfo.guildName} &7as ${tagColor}${guildInfo.rank || "Member"} &8(${formatGexp(guildInfo.totalWeeklyGexp)} GEXP)`
            ).setClick("run_command", `/p ${name}`)
             .setHoverValue(hover)
        );
    }
}

register("command", function (...args) {
    const sub = (args[0] || "help").toLowerCase();
    if (["help", " ", undefined].includes(sub)) {
        showHelp();
        return;
    }
    if (sub === "settings") {
        config.getConfig().openGui();
        return;
    }
    if (["lobby", "player"].includes(sub)) {
        if (apiCooldownUntil > Date.now()) {
            const waitLeft = apiCooldownUntil - Date.now();
            ChatLib.chat(new Message(
                new TextComponent(`&cAPI overloaded! Please wait ${(waitLeft / 1000).toFixed(1)} seconds.`)
                    .setHoverValue("Go to blablabla.website to support me in getting a production api key")
            ));
            return;
        }
    }
    if (sub === "lobby") {
        const me = Player.getName();
        const names = World.getAllPlayers().map(p => p.getName()).filter(n => n && n !== me);
        const activeFilters = [];
        if (hasMinLevel()) activeFilters.push(`lvl ${getMinLevel()}`);
        if (hasMinCata()) activeFilters.push(`cata ${getMinCata()}`);
        if (hasMinNw()) activeFilters.push(`nw ${formatNwSuffix(getMinNw())}`);
        const filtersText = activeFilters.length ? ` with filters: ${activeFilters.join(", ")}` : "";
        ChatLib.chat(`&e[&dGuildUtils&e]&a Checking lobby players${filtersText}...`);
        let apiOverloaded = false;
        new java.lang.Thread(() => {
            names.forEach(name => {
                if (apiOverloaded) return;
                try {
                    let url = getApiBase() + `?name=${encodeURIComponent(name)}`;
                    if (!hasMinLevel() && !hasMinCata() && !hasMinNw()) {
                        url += `&minlevel=0`;
                    } else {
                        if (hasMinLevel()) url += `&minlevel=${getMinLevel()}`;
                        if (hasMinCata()) url += `&mincata=${getMinCata()}`;
                        if (hasMinNw()) url += `&minnw=${getMinNw()}`;
                    }

                    let raw = httpGet(url);
                    let data;
                    try {
                        data = JSON.parse(raw);
                    } catch (e) {
                        handleError("API returned invalid response", raw);
                        return;
                    }
                    if (data && data.errorCode === "TOO_MANY_REQUESTS" && data.waitMs) {
                        handleTooManyRequests(data.waitMs);
                        apiOverloaded = true;
                        ChatLib.chat(new Message(
                            new TextComponent(`&cAPI overloaded! Please wait ${(data.waitMs / 1000).toFixed(1)} seconds.`)
                                .setHoverValue("Go to blablabla.website to support me in getting a better api key")
                        ));
                        return;
                    }
                    if (!data.uuidFound) {
                        if (!shouldSuppressErrors()) {
                            ChatLib.chat(new Message(
                                new TextComponent(`&c${name} is not a valid player!`).setHoverValue("This username is not a valid Minecraft account.")
                            ));
                        }
                        return;
                    }
                    if (!data.passesAll) return;
                    const lvl = data.level;
                    const cata = data.cataLevel;
                    const nw = data.networth;
                    if (!shouldShowPlayer(data.guild_info)) return;

                    ChatLib.chat(buildReplyMessage({lvl, name, guildInfo: data.guild_info, cataLevel: cata, networth: nw}));
                    java.lang.Thread.sleep(150);
                } catch (e) {
                    handleError(`Failed for ${name}`, e);
                }
            });
            if (!apiOverloaded) {
                ChatLib.chat("&e[&dGuildUtils&e]&a Done.");
            }
        }).start();
        return;
    }
    if (sub === "player") {
        const name = args[1];
        if (!name) {
            ChatLib.chat("&cUsage: /gu player <name>");
            return;
        }
        ChatLib.chat(`&e[&dGuildUtils&e]&a Checking player: ${name}`);
        new java.lang.Thread(() => {
            try {
                let url = getApiBase() + `?name=${encodeURIComponent(name)}`;
                if (!hasMinLevel() && !hasMinCata() && !hasMinNw()) {
                    url += `&minlevel=0`;
                } else {
                    if (hasMinLevel()) url += `&minlevel=${getMinLevel()}`;
                    if (hasMinCata()) url += `&mincata=${getMinCata()}`;
                    if (hasMinNw()) url += `&minnw=${getMinNw()}`;
                }

                const raw = httpGet(url);
                const data = JSON.parse(raw);
                if (!data.uuidFound) {
                    if (!shouldSuppressErrors()) {
                        ChatLib.chat(new Message(
                            new TextComponent(`&c${name} is not a valid player!`).setHoverValue("This username is not a valid Minecraft account.")
                        ));
                    }
                    return;
                }
                const lvl = data.level;
                const cata = data.cataLevel;
                const nw = data.networth;
                ChatLib.chat(buildReplyMessage({lvl, name, guildInfo: data.guild_info, cataLevel: cata, networth: nw}));
            } catch (e) {
                handleError(`Failed for ${name}`, e);
            }
        }).start();
        return;
    }
    showHelp();
}).setName("gu");
