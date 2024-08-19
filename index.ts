import { LokiJsConnection } from "@js-soft/docdb-access-loki"
import { SimpleLoggerFactory } from "@js-soft/simple-logger"
import { EventEmitter2EventBus } from "@js-soft/ts-utils"
import { AccountController, Transport } from "@nmshd/transport"
import { LogLevel } from "typescript-logging"

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
    new SimpleLoggerFactory(LogLevel.Error)
  )

  await transport.init()

  return transport
}

async function run() {
  const transport = await createTransport()

  const account = await new AccountController(transport, await transport.createDatabase("asd"), transport.config).init()

  console.log(`Starting identity deletion processes for '${account.identity.address.toString()}'.`)

  const identityDeletionProcesses = await Promise.all([
    account.identityDeletionProcess.initiateIdentityDeletionProcess(),
    account.identityDeletionProcess.initiateIdentityDeletionProcess(),
  ])

  console.log(
    "Resulting Identity Deletion Processes",
    identityDeletionProcesses.map((process) => process.id.toString()).join(", ")
  )
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
