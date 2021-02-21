const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map(item => {
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      hash: true,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: false,
      minify: {
        collapseWhitespace: true,
        removeStyleLinkTypeAttributes: true,
        removeScriptTypeAttributes: true,
        removeComments: true
      }
    });
  });
}

const htmlPlugins = generateHtmlPlugins('./src/html/pages');

const entries = {
  entry: ['./src/js/index.js', './src/css/main.css'],
  output: {
    filename: 'js/[name].js'
  },
  resolve: {
    alias: {
        '~': path.resolve(__dirname, './'),
    }
  },
  devtool: 'source-map'
};

const pluginsDev = {
  plugins: [
    ...htmlPlugins,
    new HtmlWebpackInlineSVGPlugin({
      runPreEmit: true
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyWebpackPlugin([
      {
        from: './src/img',
        to: './img'
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: './src/fonts',
        to: './fonts'
      }
    ])
  ]
};

const pluginsProd = {
  plugins: [
    ...htmlPlugins,
    new HtmlWebpackInlineSVGPlugin({
      runPreEmit: true
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyWebpackPlugin([
      {
        from: './src/img',
        to: './img'
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: './src/fonts',
        to: './fonts'
      }
    ]),
    new ImageminPlugin({ test: /\.(jpe?g|png|gif|svg)$/i })
  ]
};

const devServer = {
  devServer: {
    overlay: true,
    port: 3000,
    stats: 'errors-only'
  }
};

module.exports = (env, argv) => {
  let config,
    postCssProd = [];

  if (argv.mode === 'production') {
    postCssProd = [
      require('cssnano')({
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true
            }
          }
        ]
      })
    ];
  }

  const modules = {
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          include: path.resolve(__dirname, 'src/css'),
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                sourceMap: true,
                plugins: [
                  require('postcss-import'),
                  require('postcss-preset-env')({
                    stage: 0
                  }),
                  require('autoprefixer'),
                  require('postcss-focus')
                ].concat(postCssProd)
              }
            }
          ]
        },
        {
          test: /\.(woff|woff(2)|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts',
                publicPath: '../fonts'
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'img',
                publicPath: '../img'
              }
            },
            {
              loader: 'image-webpack-loader',
              options: {
                mozjpeg: {
                  progressive: true,
                  quality: 70
                },
                optipng: {
                  progressive: true,
                  quality: 70
                },
                svgo: {
                  progressive: true,
                  quality: 70
                }
              }
            }
          ]
        },
        {
          test: /\.html$/,
          include: path.resolve(__dirname, 'src/html/templates'),
          use: ['raw-loader']
        }
      ]
    }
  };

  if (argv.mode === 'development') {
    config = {
      ...entries,
      ...modules,
      ...pluginsDev,
      ...devServer
    };
    return config;
  }

  if (argv.mode === 'production') {
    config = {
      ...entries,
      ...modules,
      ...pluginsProd
    };
    return config;
  }
};
