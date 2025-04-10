import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const topic = String(req.query.topic);
        const subtopic = String(req.query.subtopic);
        const filePath = path.join(CONTENT_DIR, `${topic}.md`);

        // Read the current file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        // If this is a subtopic deletion and there are other subtopics, we'll navigate to the parent
        if (data.subtopics.length > 1) {
            data.subtopics = data.subtopics.filter((st: string) => st !== subtopic);
            // Remove the subtopic content from the markdown
            const lines = content.split('\n');
            const newLines = [];
            let isInSubtopic = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim().toLowerCase() === `## ${subtopic.toLowerCase()}`) {
                    isInSubtopic = true;
                    continue;
                } else if (line.startsWith('## ') && isInSubtopic) {
                    isInSubtopic = false;
                }
                
                if (!isInSubtopic) {
                    newLines.push(line);
                }
            }

            // Create new content with updated frontmatter and content
            const newContent = matter.stringify(newLines.join('\n'), data);
            fs.writeFileSync(filePath, newContent);

            return res.status(200).json({ 
                message: 'Subtopic deleted successfully',
                navigation: { type: 'parent', path: `/${topic}` }
            });
        }

        // If this is the last subtopic, delete the whole file
        fs.unlinkSync(filePath);

        // Find the first available topic to navigate to
        const files = fs.readdirSync(CONTENT_DIR);
        const firstAvailableTopic = files
            .filter(f => f.endsWith('.md'))
            .map(f => f.replace(/\.md$/, ''))
            .find(f => f !== topic);

        return res.status(200).json({ 
            message: 'File deleted successfully',
            navigation: firstAvailableTopic 
                ? { type: 'topic', path: `/${firstAvailableTopic}` }
                : { type: 'home', path: '/' }
        });

    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ message: 'Error deleting content' });
    }
}
