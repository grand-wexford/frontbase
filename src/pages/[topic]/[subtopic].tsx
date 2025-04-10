import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import 'highlight.js/styles/github.css';
import Sidebar from "../../components/Sidebar";

// Configure marked with proper options
marked.use(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code: string, lang: string) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

marked.setOptions({
    gfm: true,
    breaks: true
});
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

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
    subtopic: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getStaticPaths() {
    const files = fs.readdirSync(CONTENT_DIR);
    const paths: { params: { topic: string; subtopic: string } }[] = [];

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent) as { data: TopicData };
        const topic = file.replace(/\.md$/, "");

        if (data.subtopics) {
            data.subtopics.forEach((subtopic: string) => {
                paths.push({
                    params: {
                        topic,
                        subtopic,
                    },
                });
            });
        }
    }

    return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { topic: string; subtopic: string } }) {
    const { topic, subtopic } = params;
    const files = fs.readdirSync(CONTENT_DIR);
    const topics = files.map((file) => file.replace(/\.md$/, ""));

    // Получаем данные для всех тем
    const topicsData: TopicsData = {};
    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent) as { data: TopicData };
        topicsData[file.replace(/\.md$/, "")] = data;
    }

    // Получаем контент подтемы
    const filePath = path.join(CONTENT_DIR, `${topic}.md`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { content: fullContent, data: currentData } = matter(fileContent);

    // Находим контент подтемы
    const lines = fullContent.split('\n');
    let subtopicContent: string[] = [];
    let isInSubtopic = false;
    let foundSubtopic = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().toLowerCase() === `## ${subtopic.toLowerCase()}`) {
            isInSubtopic = true;
            foundSubtopic = true;
            subtopicContent.push(line);
        } else if (line.startsWith('## ') && isInSubtopic) {
            isInSubtopic = false;
        } else if (isInSubtopic) {
            subtopicContent.push(line);
        }
    }

    const content = foundSubtopic ? subtopicContent.join('\n') : "Контент не найден.";

    return {
        props: {
            content,
            currentData,
            topics,
            topicsData,
            topic,
            subtopic,
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

export default function SubtopicPage({ content, currentData, topics, topicsData, topic, subtopic }: PageProps) {
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
            body: JSON.stringify({ slug: `${topic}/${subtopic}`, content: text }),
        });
        setEditMode(false);
        router.replace(router.asPath);
    };

    return (
        <div className="d-flex min-vh-100">
            <Sidebar topics={topics} topicsData={topicsData} currentTopic={topic} currentSubtopic={subtopic} />

            <main className="flex-fill p-5 position-relative">
                <div className="d-flex justify-content-between align-items-start mb-4 pb-2 border-bottom">
                    <h1 className="h2 mb-0">{subtopic}</h1>
                    <div>
                        <button
                            className="btn btn-primary me-2"
                            onClick={() => setEditMode(true)}
                        >
                            Редактировать
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={async () => {
                                if (window.confirm('Вы уверены, что хотите удалить эту страницу?')) {
                                    try {
                                        const response = await fetch(
                                            `/api/delete?topic=${topic}&subtopic=${subtopic}`,
                                            { method: 'DELETE' }
                                        );
                                        if (response.ok) {
                                            router.push('/');
                                        } else {
                                            alert('Ошибка при удалении страницы');
                                        }
                                    } catch (error) {
                                        console.error('Error deleting page:', error);
                                        alert('Ошибка при удалении страницы');
                                    }
                                }
                            }}
                        >
                            Удалить
                        </button>
                    </div>
                </div>
                {!editMode ? (
                    <>
                        <div
                            className="content-wrapper mb-4"
                            dangerouslySetInnerHTML={{ __html: marked(text) }}
                        />
                       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css" />

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
