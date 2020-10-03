import puppeteer from 'puppeteer';
import readline from 'readline';
import chalk from 'chalk';

const LANGUAGE_FROM = "zh";

const URL = {
  deepl: `https://www.deepl.com/ja/translator#${LANGUAGE_FROM}/ja/`,
  baidu: `https://fanyi.baidu.com/#${LANGUAGE_FROM}/jp/`
};

class Translator {
  constructor() {
    this.browser = null;
    this.page = {
      deepl: null,
      baidu: null
    };

    this._initialize();
  }

  async _initialize() {
    this.browser = await puppeteer.launch();

    for (const key in this.page) {
      this.page[key] = await this.browser.newPage();
    }
  }

  async translate() {
    const copiedText = await this._getTextFromClipBoard()

    switch (copiedText.slice(0, 2)) {
      case 'd>':
        await this.translateByDeepl(copiedText.slice(2));
        break;
      case 'b>':
        await this.translateByBaidu(copiedText.slice(2));
        break;
      default:
        await Promise.all([
          this.translateByDeepl(copiedText),
          this.translateByBaidu(copiedText)
        ])
        break;
    }

    console.log("")
  }

  async translateByDeepl(targetText) {
    await this.page.deepl.goto(`${URL.deepl}${targetText}`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]')`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value`);
    await this.page.deepl.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value.length > 0`);

    const results =  await this.page.deepl.$$('.lmt__translations_as_text__text_btn')
    const suffix = results.length > 1 ? ` ...` : '';

    const tranlatedText = await results[0].evaluate(node => node.innerText) + suffix;

    console.log(chalk.hex('#9aaab5')(tranlatedText));
  }

  async translateByBaidu(targetText) {
    await this.page.baidu.goto(`${URL.baidu}${targetText}`);
    await this.page.baidu.waitForFunction(`document.querySelector('.target-output')`);
    await this.page.baidu.waitForFunction(`document.querySelector('.target-output > span')`);

    const results = await this.page.baidu.$$('.target-output > span');

    const strs = await Promise.all(results.map(res => res.evaluate(node => node.innerText)));

    const translatedText = strs.join('');

    console.log(chalk.white(translatedText));

    for (const span of results) {
      span.evaluate(node => {
        node.parentNode.removeChild(node)
      })
    }

    return results
  }

  async keepTranslating() {
    while (true)
      await this.translate();
  }

  _getTextFromClipBoard() {
    const line = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

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
  const translater = new Translator();

  await translater.keepTranslating();

  translater.close();
})();
