import fs from "fs";
import path from "path";
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), "content");

import type { NextApiRequest, NextApiResponse } from 'next';

interface Section {
  title: string;
  content: string[];
  level: number;
}

function extractFrontMatter(content: string): { frontMatter: string, restContent: string } {
  const lines = content.split('\n');
  let frontMatterLines: string[] = [];
  let contentLines: string[] = [];
  let inFrontMatter = false;
  let foundFirstMarker = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!foundFirstMarker) {
        // Начало frontmatter
        foundFirstMarker = true;
        inFrontMatter = true;
        frontMatterLines.push(line);
      } else if (inFrontMatter) {
        // Конец frontmatter
        inFrontMatter = false;
        frontMatterLines.push(line);
      } else {
        // Это просто строка с --- в контенте
        contentLines.push(line);
      }
      continue;
    }

    if (inFrontMatter) {
      frontMatterLines.push(line);
    } else if (foundFirstMarker && !inFrontMatter) {
      contentLines.push(line);
    }
  }

  return {
    frontMatter: frontMatterLines.join('\n'),
    restContent: contentLines.join('\n').trim()
  };
}

function splitMarkdownSections(content: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let introContent: string[] = [];

  const lines = content.split('\n');
  for (let line of lines) {
    if (line.startsWith('# ')) {
      if (introContent.length > 0) {
        sections.push({ title: '', content: introContent, level: 0 });
        introContent = [];
      }
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: line.substring(2).trim(), content: [line], level: 1 };
    } else if (line.startsWith('## ')) {
      if (introContent.length > 0) {
        sections.push({ title: '', content: introContent, level: 0 });
        introContent = [];
      }
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: line.substring(3).trim(), content: [line], level: 2 };
    } else {
      if (currentSection) {
        currentSection.content.push(line);
      } else {
        introContent.push(line);
      }
    }
  }

  if (introContent.length > 0) {
    sections.push({ title: '', content: introContent, level: 0 });
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function mergeMarkdownContent(original: string, sectionTitle: string, newContent: string): string {
  const { frontMatter, restContent } = extractFrontMatter(original);
  const sections = splitMarkdownSections(restContent);

  const sectionIndex = sections.findIndex(s => s.level === 2 && s.title === sectionTitle);
  if (sectionIndex !== -1) {
    sections[sectionIndex] = {
      title: sectionTitle,
      content: newContent.split('\n'),
      level: 2
    };
  }

  const normalize = (lines: string[]) => {
    const trimmedStart = lines.slice(); // копируем
    while (trimmedStart.length && trimmedStart[0].trim() === '') {
      trimmedStart.shift();
    }
    while (trimmedStart.length && trimmedStart[trimmedStart.length - 1].trim() === '') {
      trimmedStart.pop();
    }
    return trimmedStart;
  };

  const allContent = sections
    .map(section => normalize(section.content).join('\n'))
    .filter(Boolean)
    .join('\n\n');

  return `${frontMatter}\n\n${allContent}`;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { slug, content } = req.body;
      console.log('Received request:', { slug, contentLength: content.length });

      if (!slug || typeof slug !== 'string') {
        throw new Error('Invalid slug');
      }

      const [topic, subtopic] = slug.split('/');
      console.log('Parsed path:', { topic, subtopic });

      const filePath = path.join(CONTENT_DIR, `${topic}.md`);
      console.log('File path:', filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const newContent = mergeMarkdownContent(fileContent, subtopic, content);

      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('File saved successfully');

      return res.status(200).json({ message: "Контент сохранен" });
    } catch (error) {
      console.error('Error saving content:', error);
      return res.status(500).json({ 
        message: 'Ошибка при сохранении',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
