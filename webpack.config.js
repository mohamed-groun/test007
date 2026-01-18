const Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')

    .addEntry('app', './assets/app.js')

    .enableSingleRuntimeChunk()

    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = '3';
    })

    .enableSassLoader()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction());

module.exports = Encore.getWebpackConfig();
