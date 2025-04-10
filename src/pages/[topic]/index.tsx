import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";

interface TopicData {
    title?: string;
    subtopics?: string[];
}

interface TopicsData {
    [key: string]: TopicData;
}

interface PageProps {
    content: string;
    currentData: TopicData;
    topics: string[];
    topicsData: TopicsData;
    topic: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getStaticPaths() {
    const allFiles = fs.readdirSync(CONTENT_DIR);
    const files = allFiles.filter(file => {
        const filePath = path.join(CONTENT_DIR, file);
        return file.endsWith('.md') && fs.statSync(filePath).isFile();
    });

    const paths = files.map((file) => ({
        params: { topic: file.replace(/\.md$/, "") },
    }));

    return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { topic: string } }) {
    const { topic } = params;
    const allFiles = fs.readdirSync(CONTENT_DIR);
    const files = allFiles.filter(file => {
        const filePath = path.join(CONTENT_DIR, file);
        return file.endsWith('.md') && fs.statSync(filePath).isFile();
    });

    const topics = files.map((file) => file.replace(/\.md$/, ""));

    // Получаем данные для всех тем
    const topicsData: TopicsData = {};
    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent) as { data: TopicData };
        topicsData[file.replace(/\.md$/, "")] = data;
    }

    // Получаем контент темы
    const filePath = path.join(CONTENT_DIR, `${topic}.md`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { content, data: currentData } = matter(fileContent);

    return {
        props: {
            content,
            currentData,
            topics,
            topicsData,
            topic,
        },
    };
}

// Настройка marked
marked.use(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

marked.use({
    breaks: true,
    gfm: true
});

export default function TopicPage({ content, currentData, topics, topicsData, topic }: PageProps) {
    const [editMode, setEditMode] = useState(false);
    const [text, setText] = useState(content);
    const router = useRouter();

    useEffect(() => {
        setText(content);
        setEditMode(false);
    }, [content]);

    const saveContent = async () => {
        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: topic, content: text }),
        });
        setEditMode(false);
        router.replace(router.asPath);
    };

    return (
        <div className="d-flex min-vh-100">
            <Sidebar topics={topics} topicsData={topicsData} currentTopic={topic} />

            <main className="flex-fill p-5">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css" />
                <h1 className="h3 mb-4">{currentData.title || topic}</h1>
                {!editMode ? (
                    <>
                        <div
                            className="mb-4"
                            dangerouslySetInnerHTML={{ __html: marked(text) }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditMode(true)}
                        >
                            Редактировать
                        </button>
                    </>
                ) : (
                    <>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="form-control mb-4"
                            rows={10}
                        />
                        <button
                            className="btn btn-success me-2"
                            onClick={saveContent}
                        >
                            Сохранить
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setEditMode(false)}
                        >
                            Отмена
                        </button>
                    </>
                )}
            </main>
        </div>
    );
}
