const {
  join,
  resolve
} = require('path')

const constants = require('./webpack.constants')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssEasings = require('postcss-easings');


const DefineENV = new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
})

const CSS_LOADERS = {
  css: '',
  scss: '!sass-loader'
};

const ASSETS_DIR = "https://storage.googleapis.com/samrad-adddog/www-assets/assets/"

const ENV_VARS = {
  SOCKET_SERVER: '"http://0.0.0.0:8080"',
  APP_HOST: '"https://add.dog/"',
  APP_DOMAIN: '"/"',
  ASSETS_DIR: '"https://storage.googleapis.com/samrad-adddog/www-assets/assets/"',
  REMOTE_ASSETS_DIR: '"https://storage.googleapis.com/samrad-adddog/www-assets/assets/"'
}


module.exports = env => {
  const isDev = !!env.dev
  const isProd = !!env.prod
  const isTest = !!env.test
  console.log("--------------");
  console.log(isDev, isProd, isTest);
  console.log("--------------");
  const addPlugin = (add, plugin) => add ? plugin : undefined
  const ifDev = plugin => addPlugin(env.dev, plugin)
  const ifProd = plugin => addPlugin(env.prod, plugin)
  const ifNotTest = plugin => addPlugin(!env.test, plugin)
  const removeEmpty = array => array.filter(i => !!i)

  const stylesLoaders = () => {
    let _l = Object.keys(CSS_LOADERS).map(ext => {
      const prefix = 'css-loader?-minimize!postcss-loader';
      const extLoaders = prefix + CSS_LOADERS[ext];
      const loader = isDev ? `style-loader!${extLoaders}` : ExtractTextPlugin.extract('style-loader', extLoaders);
      return {
        loader,
        test: new RegExp(`\\.(${ext})$`),
      };
    });
    console.log(_l);
    return _l
  }

  return {
    entry: {
      app: './app.js',
      vendor: ['react', 'react-dom', 'lodash']
    },
    output: {
      filename: 'bundle.[name].[chunkhash].js',
      path: constants.DIST,
      pathinfo: !env.prod,
    },
    context: constants.SRC_DIR,
    devtool: env.prod ? 'source-map' : 'eval',
    devServer: {
      host: '0.0.0.0',
      inline: true,
      hot: true,
      stats: {
        colors: true
      },
      contentBase: constants.SRC_DIR,
      historyApiFallback: !!env.dev,
      port: 8081
    },
    bail: env.prod,
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    module: {
      loaders: [{
          test: /\.svg$/,
          loader: 'svg-inline'
        }, {
          loader: 'url-loader?limit=100000',
          test: /\.(gif|jpg|png)$/
        }, {
          loader: 'url-loader?limit=100000',
          test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9]+)?$/,
          include: [`${join(constants.ASSETS_DIR, '/font/')}`]
        }, {
          test: /\.json$/,
          loader: 'json'
        }, {
          test: /\.(js|jsx)$/,
          loader: 'babel',
          exclude: /node_modules(?!\/dis-gui)/
        }, {
          test: /\.(glsl|vert|frag)$/,
          loader: 'shader',
          exclude: /node_modules/
        }
        /*, {
                test: /\.scss$/,
                exclude: /node_modules/,
                loader: "style-loader!css-loader!postcss-loader?pack=cleaner"
              }*/
      ].concat(stylesLoaders()),
    },
    sassLoader: {
      assetsUrl: `"${ASSETS_DIR}"`,
      includePaths: [
        join(constants.SRC_DIR, '/base'),
        join(constants.SRC_DIR, '/base/vars')
      ],
    },
    plugins: removeEmpty([
      new webpack.DefinePlugin({
        'process.env': ENV_VARS
      }),
      ifDev(new HtmlWebpackPlugin({
        template: './index.html'
      })),
      ifProd(new HtmlWebpackPlugin({
        assetsUrl: `"${ASSETS_DIR}`,
        template: './index.ejs', // Load a custom template (ejs by default see the FAQ for details)
      })),
      ifProd(new ExtractTextPlugin('[name]-[hash].css', {
        allChunks: true
      })),
      ifProd(new webpack.optimize.DedupePlugin()),
      ifProd(new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
        quiet: true,
      })),
      // saves 65 kB with Uglify!! Saves 38 kB without
      DefineENV,
      // saves 711 kB!!
      ifProd(new webpack.optimize.UglifyJsPlugin({
        compress: {
          screw_ie8: true, // eslint-disable-line
          warnings: false,
        },
      })),
      ifNotTest(new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor'
      })),
      ifNotTest(new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        fileName: 'bundle.common.js'
      }))
    ]),
    postcss: () => [
      autoprefixer({
        browsers: [
          'last 2 versions',
          'iOS >= 8',
          'Safari >= 8',
        ]
      }),
      postcssEasings
    ],
  }
}
