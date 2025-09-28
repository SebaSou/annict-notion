import { getMyWorks } from "./annict.js";
import { createNewAnimePage, editAnimePage } from "./notion.js";
import { setTimeout } from 'timers/promises';
import { writeFile, readFile, mkdir } from 'fs/promises';
let animeData = {};
try {
  const file = await readFile('./data/data.json', 'utf-8');
  animeData = JSON.parse(file);
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

async function syncAnnictToNotion(status) {
  const data = {};
  const works = await getMyWorks(status);
  for (const work of works) {

    if (data[work.id]) { continue };
    if (!animeData[work.id]) {
      const response = await createNewAnimePage(work);
      data[work.id] = { notion_id: response.id, status };
      console.log(`Notionページ作成: ${work.title}`);
      await setTimeout(400);
    } else if (animeData[work.id].status !== status) {
      const notion_id = animeData[work.id].notion_id;
      data[work.id] = { notion_id, status };
      editAnimePage(notion_id, { status: { kind: status } });
      console.log(`ステータスの更新: ${work.title}`);
    };

  };

  return data
}

async function main() {
  Object.assign(animeData, await syncAnnictToNotion("watching"));
  Object.assign(animeData, await syncAnnictToNotion("watched"));
  Object.assign(animeData, await syncAnnictToNotion("wanna_watch"));
  Object.assign(animeData, await syncAnnictToNotion("on_hold"));
  Object.assign(animeData, await syncAnnictToNotion("stop_watching"));
  
  await writeFile('./data/data.json', JSON.stringify(animeData, null, 2), 'utf-8');
}

await mkdir('./data', { recursive: true });
main();
