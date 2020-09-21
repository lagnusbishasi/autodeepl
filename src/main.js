const puppeteer = require('puppeteer');
const cp = require('copy-paste');
const readline = require('readline');

const LANGUAGE_FROM = "zh"

const URL = {
  deepl: `https://www.deepl.com/ja/translator#${LANGUAGE_FROM}/ja/`,
  baidu: `https://fanyi.baidu.com/#${LANGUAGE_FROM}/jp/`
}

class Translator {
  constructor() {
    this.browser = null
    this.page = {
      deepl: null,
      baidu: null
    }
    this.results = []

    this._initialize()
  }

  async _initialize() {
    this.browser = await puppeteer.launch()
    for (const key in this.page) {
      this.page[key] = await this.browser.newPage()
    }
  }

  async translate() {
    const copiedText = await this._getTextFromClipBoard()

    if (copiedText.slice(0, 2) == 'd_') {
      this.results = await this.translateByDeepl(copiedText.slice(2))
    }
    else {
      this.results = await this.translateByBaidu(copiedText)
    }

    const suffix = this.results.length > 1 ? ` ...` : ''

    console.log(await this.results[0].evaluate(node => node.innerText) + suffix)
    console.log("")
  }

  async translateByDeepl(targetText) {
    await this.page.deepl.goto(`${URL.deepl}${targetText}`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]')`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value.length > 0`);

    return await this.page.deepl.$$('.lmt__translations_as_text__text_btn')
  }

  async translateByBaidu(targetText) {
    await this.page.baidu.goto(`${URL.baidu}${targetText}`);

    await this.page.baidu.waitForFunction(`document.querySelector('.target-output')`);

    await this.page.baidu.waitForFunction(`document.querySelector('.target-output > span')`);

    const result = await this.page.baidu.$$('.target-output > span')

    for (const span of result) {
      span.evaluate(node => {
        node.parentNode.removeChild(node)
      })
    }

    return result
  }

  async keepTranslating() {
    while (true)
      await this.translate()
  }

  _getTextFromClipBoard() {
    const line = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve, reject) => {
      line.question(': ', answer => {
        resolve(answer)
        line.close();
      })
    })
  }

  close() {
    this.browser.close();
  }
}

(async () => {
  const translater = new Translator()

  await translater.keepTranslating()

  await translater.close()
})();
