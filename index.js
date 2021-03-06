const program = require('commander')
const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cowsay = require('cowsay')

const config = require('./config.json')
const peer = require('./lib/network/peers')
const transaction = require('./lib/network/transaction')
const senators = require('./lib/consensus/senators')
const peerRunner = require('./lib/network/runner')
const consensusRunner = require('./lib/consensus/runner')
const walletAccount = require('./lib/wallet/account')
const blocks = require('./lib/network/block')
const blockchain = require('./lib/block/blockchain')
program
  .version(config.version)
  .option('-i, --integer <n>', 'An integer argument', parseInt)
  // .option('-p, --port <n>', 'a port for Moechain', parseInt)
  .parse(process.argv)

if (program.port) {
  config.port = program.port
}

onerror(app)

app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())

app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

app.use(peer.routes(), peer.allowedMethods())
app.use(transaction.routes(), transaction.allowedMethods())
app.use(senators.routes(), senators.allowedMethods())
app.use(walletAccount.routes(), walletAccount.allowedMethods())
app.use(blocks.routes(), blocks.allowedMethods())

app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

peerRunner.runner()

blockchain.loadblocks()

let runner = new consensusRunner()
runner.start()

module.exports = app


if(process.env.PORT !== null) {
    config.port = process.env.PORT
}

app.listen(config.port)
console.log(
  cowsay.say({
    text: 'Moechain is listening on port: %s :-)',
    T: 'U '
  }),
  config.port
)
