import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { describe, afterAll, beforeAll, test, expect } from 'vitest'
import type { Browser } from 'playwright-chromium'
import sentryTestkit from 'sentry-testkit'
import { setup, url } from '@nuxtjs/module-test-utils'
import type { Nuxt } from '../src/kit-shim'
import { $$, createBrowser, loadConfig } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { localServer } = sentryTestkit.default()
const TEST_DSN = 'http://acacaeaccacacacabcaacdacdacadaca@sentry.io/000001'

describe('Smoke test (lazy)', () => {
  let nuxt: Nuxt
  let browser: Browser

  beforeAll(async () => {
    await localServer.start(TEST_DSN)
    const dsn = localServer.getDsn() ?? undefined
    nuxt = (await setup(loadConfig(__dirname, 'lazy', { sentry: { dsn } }, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
    await localServer.stop()
  })

  test('builds, runs and there are no errors', async () => {
    const page = await browser.newPage()

    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    const consoleMessages: string[] = []
    page.on('console', (message) => {
      consoleMessages.push(message.text())
    })

    await page.goto(url('/'))

    // process.sentry is not initialized in webpack context in tests.
    // expect(await $$('#server-side', page)).toBe('Works!')
    expect(await $$('#client-side', page)).toBe('Works and is ready!')
    expect(errors).toEqual([])
    expect(consoleMessages).toEqual(['Sentry is ready'])
  })
})
