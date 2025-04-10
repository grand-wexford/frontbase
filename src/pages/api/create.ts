import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { title, content, parentTopic } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        // Создаем slug из заголовка
        const slug = title.toLowerCase()
            .replace(/[^а-яёa-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');

        if (parentTopic) {
            // Добавляем как подтему
            const parentPath = path.join(CONTENT_DIR, `${parentTopic}.md`);
            
            if (!fs.existsSync(parentPath)) {
                return res.status(404).json({ message: 'Parent topic not found' });
            }

            const parentContent = fs.readFileSync(parentPath, 'utf8');
            const { data, content: existingContent } = matter(parentContent);

            // Добавляем новую подтему в frontmatter
            if (!data.subtopics) {
                data.subtopics = [];
            }
            if (!data.subtopics.includes(title)) {
                data.subtopics.push(title);
            }

            // Добавляем контент подтемы
            const newContent = matter.stringify(
                `${existingContent}

## ${title}

${content}`,
                data
            );

            fs.writeFileSync(parentPath, newContent);
            
            // Проверяем, что файл успешно обновлен
            if (fs.existsSync(parentPath)) {
                const updatedContent = fs.readFileSync(parentPath, 'utf8');
                if (updatedContent.includes(title)) {
                    return res.status(200).json({ 
                        message: 'Subtopic created successfully',
                        path: `/${parentTopic}/${slug}`
                    });
                }
            }
            return res.status(500).json({ message: 'Failed to verify subtopic creation' });
        } else {
            // Создаем новый основной раздел
            const filePath = path.join(CONTENT_DIR, `${slug}.md`);
            
            if (fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'Topic already exists' });
            }

            // Добавляем заголовок и контент
            const fileContent = matter.stringify(`# ${title}

${content}`, {
                title: title,
                subtopics: []
            });

            fs.writeFileSync(filePath, fileContent);

            // Проверяем, что файл успешно создан
            if (fs.existsSync(filePath)) {
                const createdContent = fs.readFileSync(filePath, 'utf8');
                if (createdContent.includes(title)) {
                    return res.status(200).json({ 
                        message: 'Topic created successfully',
                        path: `/${slug}`
                    });
                }
            }
            return res.status(500).json({ message: 'Failed to verify topic creation' });
        }
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ message: 'Error creating content' });
    }
}
