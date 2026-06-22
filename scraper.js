import 'dotenv/config';
import PocketBase from 'pocketbase';
import axios from 'axios';
import * as cheerio from 'cheerio';

const pb = new PocketBase('http://pocketbase-zgvssk3wql5l59p3dgc6hequ.188.245.41.185.sslip.io/');


const formatTemperature = (tempString) => tempString.trim().replace('°C', '').replace(",", ".");

async function runScraper() {
  if (!process.env.PB_EMAIL || !process.env.PB_PASSWORD) {
    console.error('Chyba: PB_EMAIL a PB_PASSWORD musí být nastaveny.');
    process.exit(1);
  }

  try {
    await pb.collection('users').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

    const { data } = await axios.get('https://www.koupaliste-lhotka.cz/');
    const $ = cheerio.load(data);

    const info = {
      waterTemp: formatTemperature($('.header-obsazenost__inner:contains("Teplota vody") strong').text()),
      airTemp: formatTemperature($('.header-obsazenost__inner:contains("Teplota vzduchu") strong').text()),
      occupancy: parseInt($('.header-obsazenost__inner:contains("obsazenost") strong').text().trim().split('/')[0].trim(), 10),
      status: $('.opening-hours p').text().trim(),
    };

    const record = await pb.collection('lhotka').create(info);

    console.log(JSON.stringify(info, null, 2));
    console.log('----------------------------------------');
    console.log(record);

    console.log('Scraping úspešne dokončený.');
    process.exit(0);
  } catch (error) {
    console.error('Chyba:', error);
    process.exit(1);
  }
}

runScraper();
