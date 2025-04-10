import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { slug, content } = req.body;
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);

    // Сохраняем новый контент в файл
    fs.writeFileSync(filePath, content, "utf8");

    return res.status(200).json({ message: "Контент сохранен" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
