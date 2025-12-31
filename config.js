import Settings from "../Amaterasu/core/Settings"
import DefaultConfig from "../Amaterasu/core/DefaultConfig"


const defaultConf = new DefaultConfig("GuildUtils", "data/settings.json")
    .addTextInput({
        configName: "SminLevel",
        title: "Minimum Level",
        description: "Lowest level players to get guild details on",
        category: "Requirements",
        value: "200",
        placeHolder: "200"
    })
    .addTextInput({
        configName: "SminCata",
        title: "Minimum Catacombs Level",
        description: "Minimum Catacombs level required (fractional values allowed, e.g. 50.5). Leave empty to disable.",
        category: "Requirements",
        value: "",
        placeHolder: "0"
    })
    .addTextInput({
        configName: "SminNw",
        title: "Minimum Networth",
        description: "Minimum Networth required (numbers only, no commas). Leave empty to disable.",
        category: "Requirements",
        value: "",
        placeHolder: "1m"
    })
    .addSwitch({
        configName: "SreplyIfGuilded",
        title: "Reply if in a guild",
        description: "Whether to give details on players if they're in a guild",
        category: "General",
        value: true
    })
    .addSwitch({
        configName: "ScleanGuildMessages",
        title: "Clean guild messages",
        description: "Only show guild name, hover for details",
        category: "General",
        value: true
    })
    .addTextInput({
        configName: "DcustomApiServer",
        title: "Custom API server",
        description: "Override the default API server URL",
        category: "Dev",
        value: "",
        placeHolder: "http://localhost:3000"
    })
    .addSwitch({
        configName: "DsupressErrors",
        title: "Suppress errors",
        description: "Hides some small errors (default ON)",
        category: "Dev",
        value: true
    })


const currentScheme = "data/ColorScheme.json"
const scheme = JSON.parse(FileLib.read("GuildUtils", currentScheme))

const config = new Settings("GuildUtils", defaultConf, currentScheme)
    .setCommand("gusettings", ["guildutilssettings"])

scheme.Amaterasu.background.color = config.settings.bgColor
FileLib.write("GuildUtils", currentScheme, JSON.stringify(scheme, null, 4))

config
    .setPos(config.settings.x, 10.5)
    .setSize(config.settings.width, 75)
    .setScheme(currentScheme)
    .apply()

export default config.settings
