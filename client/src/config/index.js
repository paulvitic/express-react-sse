import devConfig from './devConfig.json';

const env = process.env.APP_ENV || 'development';

const configs = {
    development: devConfig
};

export default (() => {
    const config = configs[env];
    config.palette = {
        color10: "#4E2E75",
        color11: "#988CA6",
        color12: "#604E75",
        color13: "#3D0F73",
        color14: "#200343",

        color20: "#AC413B",
        color21: "#F5CECC",
        color22: "#AD716E",
        color23: "#AA1109",
        color24: "#640500",

        color30: "#266169",
        color31: "#7D9396",
        color32: "#44656A",
        color33: "#075C68",
        color34: "#01363D",

        white: "#ffffff",
        blue0: "#f7fbfd",
        blue1: "#e7f7f9",
        blue2: "#82b3bb",
        blue3: "#0095b3",
        blue4: "#056679",
        blue5: "#074851"
    };
    return config;
})();
