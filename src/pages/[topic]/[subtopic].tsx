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
import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';

// Динамический импорт MDXEditor и плагинов
const MDXEditorComponent = dynamic(
  () => import('@mdxeditor/editor').then(mod => {
    const { 
      MDXEditor, 
      toolbarPlugin, 
      headingsPlugin, 
      listsPlugin, 
      quotePlugin, 
      markdownShortcutPlugin, 
      BoldItalicUnderlineToggles,
      UndoRedo,
      BlockTypeSelect,
      CreateLink,
      InsertImage,
      InsertThematicBreak,
      ListsToggle,
      CodeToggle,
      InsertCodeBlock,
      DiffSourceToggleWrapper,
      ConditionalContents,
      diffSourcePlugin,
      InsertTable,
      tablePlugin,
      codeBlockPlugin,
      sandpackPlugin,
      codeMirrorPlugin,
      directivesPlugin,
      frontmatterPlugin,
      imagePlugin,
      linkPlugin,
      linkDialogPlugin,
      thematicBreakPlugin,
      AdmonitionDirectiveDescriptor,
      KitchenSinkToolbar
    } = mod;
    return {
      default: ({ markdown, onChange, ...props }: { markdown: string; onChange: (value: string) => void; [key: string]: any }) => (
        <MDXEditor
          markdown={markdown}
          onChange={onChange}
          {...props}
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <CreateLink />
                  <InsertImage />
                  <InsertThematicBreak />
                  <ListsToggle />
                  <CodeToggle />
                  <InsertCodeBlock />
                  <InsertTable />
                </>
              )
            }),
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
            diffSourcePlugin(),
            tablePlugin(),
            codeBlockPlugin({
              defaultCodeBlockLanguage: 'javascript'
            }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                javascript: 'JavaScript',
                jsx: 'JavaScript (React)',
                tsx: 'TypeScript (React)',
                typescript: 'TypeScript',
                html: 'HTML',
                css: 'CSS',
                python: 'Python',
                php: 'PHP',
                sql: 'SQL',
                shell: 'Shell',
                bash: 'Bash',
                plaintext: 'Plain Text'
              }
            }),
            directivesPlugin(),
            frontmatterPlugin(),
            imagePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            thematicBreakPlugin()
          ]}
        />
      )
    };
  }),
  { ssr: false }
);

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
    const allFiles = fs.readdirSync(CONTENT_DIR);
    const files = allFiles.filter(file => {
        const filePath = path.join(CONTENT_DIR, file);
        return file.endsWith('.md') && fs.statSync(filePath).isFile();
    });

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
    const editorRef = useRef<any>(null);
    const router = useRouter();

    useEffect(() => {
        setText(content);
        setEditMode(false);
    }, [content]);

    const saveContent = async () => {
        try {
            console.log('Saving content:', { topic, subtopic, textLength: text.length });
            const payload = { slug: `${topic}/${subtopic}`, content: text };
            console.log('Request payload:', payload);

            const response = await fetch("/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Save error:', error);
                alert('Ошибка при сохранении');
                return;
            }

            setEditMode(false);
            router.replace(router.asPath);
        } catch (error) {
            console.error('Save error:', error);
            alert('Ошибка при сохранении');
        }
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
                        <div style={{ minHeight: '500px' }}>
                            <MDXEditorComponent
                                markdown={text}
                                onChange={(val: string) => setText(val)}
                                contentEditableClassName="content-wrapper"
                            />
                        </div>
                        <div className="mt-3">
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
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
