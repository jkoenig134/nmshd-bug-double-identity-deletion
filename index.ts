import { LokiJsConnection } from "@js-soft/docdb-access-loki"
import { SimpleLoggerFactory } from "@js-soft/simple-logger"
import { EventEmitter2EventBus } from "@js-soft/ts-utils"
import { AccountController, Transport } from "@nmshd/transport"

async function createTransport(): Promise<Transport> {
  const notDefinedEnvironmentVariables = [
    "NMSHD_TEST_BASEURL",
    "NMSHD_TEST_CLIENTID",
    "NMSHD_TEST_CLIENTSECRET",
  ].filter((env) => !process.env[env])

  if (notDefinedEnvironmentVariables.length > 0) {
    throw new Error(`Missing environment variable(s): ${notDefinedEnvironmentVariables.join(", ")}}`)
  }

  const transport = new Transport(
    LokiJsConnection.inMemory(),
    {
      baseUrl: globalThis.process.env.NMSHD_TEST_BASEURL!,
      platformClientId: globalThis.process.env.NMSHD_TEST_CLIENTID!,
      platformClientSecret: globalThis.process.env.NMSHD_TEST_CLIENTSECRET!,
      debug: true,
      supportedIdentityVersion: 1,
    },
    new EventEmitter2EventBus(() => {}),
    new SimpleLoggerFactory()
  )

  await transport.init()

  return transport
}

async function run() {
  const transport = await createTransport()

  const acc = await new AccountController(transport, await transport.createDatabase("asd"), transport.config).init()

  const x = await Promise.all([
    acc.identityDeletionProcess.initiateIdentityDeletionProcess(),
    acc.identityDeletionProcess.initiateIdentityDeletionProcess(),
  ])

  console.log(x)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
