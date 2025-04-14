import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/github.css';
import Sidebar from "../../components/Sidebar";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    codeBlockPlugin,
    linkPlugin,
    tablePlugin,
    thematicBreakPlugin,
    frontmatterPlugin,
    linkDialogPlugin,
    BoldItalicUnderlineToggles,
    ListsToggle,
    BlockTypeSelect,
    CreateLink,
    InsertCodeBlock,
    InsertTable,
    InsertThematicBreak,
    codeMirrorPlugin,
    InsertQuote,
    Frontmatter,
    LinkDialog,
    CodeMirrorEditor,
    sandpackPlugin,
    ConditionalContents,
    ChangeCodeMirrorLanguage,
    ShowSandpackInfo,
    InsertSandpack
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

// Настройка marked
marked.use({
    gfm: true,
    breaks: true,
    highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlightAuto(code, [language]).value;
    }
});

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getStaticPaths() {
    const allFiles = fs.readdirSync(CONTENT_DIR);
    const files = allFiles.filter(file => {
        const filePath = path.join(CONTENT_DIR, file);
        return file.endsWith('.md') && fs.statSync(filePath).isFile();
    });

    const paths = [];

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent);
        const topic = file.replace(/\.md$/, "");

        if (data.subtopics) {
            data.subtopics.forEach(subtopic => {
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

export async function getStaticProps({ params }) {
    const { topic, subtopic } = params;
    const allFiles = fs.readdirSync(CONTENT_DIR);
    const files = allFiles.filter(file => {
        const filePath = path.join(CONTENT_DIR, file);
        return file.endsWith('.md') && fs.statSync(filePath).isFile();
    });

    const topics = files.map(file => file.replace(/\.md$/, ""));

    const topicsData = {};
    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent);
        topicsData[file.replace(/\.md$/, "")] = data;
    }

    const currentFilePath = path.join(CONTENT_DIR, `${topic}.md`);
    const currentFileContent = fs.readFileSync(currentFilePath, "utf8");
    const { data: currentData } = matter(currentFileContent);

    const lines = currentFileContent.split('\n');
    let isInSubtopic = false;
    let foundSubtopic = false;
    const subtopicContent = [];

    for (const line of lines) {
        if (line.startsWith('## ') && line.includes(subtopic)) {
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

export default function SubtopicPage({ content, currentData, topics, topicsData, topic, subtopic }) {
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [text, setText] = useState('');

    useEffect(() => {
        if (content) {
            const contentWithoutHeader = content.replace(new RegExp(`^## ${subtopic}\n\n`), '');
            setText(contentWithoutHeader);
        }
    }, [content, subtopic]);

    const saveContent = async () => {
        try {
            // 1. Удаляем лишние пробелы по краям
            let cleaned = text.trim();

            // 2. Заменяем более двух подряд идущих пустых строк на одну
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

            // 3. Убираем пробелы в пустых строках (чтобы не было " \n")
            cleaned = cleaned.replace(/\n[ \t]+\n/g, '\n\n');

            const contentWithHeader = `## ${subtopic}\n\n${cleaned}`;
            const payload = { slug: `${topic}/${subtopic}`, content: contentWithHeader };

            const response = await fetch("/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
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

    const deleteContent = async () => {
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
                alert('Ошибка при удалении страницы');
            }
        }
    };


    console.log('Initializing code block plugin');
    const codeBlockPluginConfig = codeBlockPlugin({
        codeBlockEditorComponents: {
            js: CodeMirrorEditor,  // Используем один редактор для всех
        },
    });

    console.log('codeBlockPluginConfig:', codeBlockPluginConfig);


    console.log(text);
    const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

    const simpleSandpackConfig = {
        defaultPreset: 'react',
        presets: [
            {
                label: 'React',
                name: 'react',
                meta: 'live react',
                sandpackTemplate: 'react',
                sandpackTheme: 'light',
                snippetFileName: '/App.js',
                snippetLanguage: 'jsx',
                initialSnippetContent: defaultSnippetContent
            }
        ]
    }


    return (
        <div className="container-fluid">
            <div className="row">
                <Sidebar
                    topics={topics}
                    topicsData={topicsData}
                    currentTopic={topic}
                    currentSubtopic={subtopic}
                />
                <div className="col-sm-10 col-md-10 col-lg-10">
                    <div className="content-container p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="page-title mb-0">
                                {currentData.title || topic} - {subtopic}
                            </h1>
                            <div>
                                <button
                                    className="btn btn-primary me-2"
                                    onClick={() => setEditMode(true)}
                                >
                                    Редактировать
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={deleteContent}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>

                        {!editMode ? (
                            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
                        ) : (
                            <div className="editorContainer">
                                <MDXEditor
                                    markdown={text}
                                    onChange={setText}
                                    plugins={[
                                        headingsPlugin(),
                                        listsPlugin(),
                                        quotePlugin(),
                                        thematicBreakPlugin(),
                                        markdownShortcutPlugin(),
                                        linkPlugin(),
                                        tablePlugin(),
                                        frontmatterPlugin(),
                                        linkDialogPlugin(),
                                        // the default code block language to insert when the user clicks the "insert code block" button
                                        codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                                        sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),
                                        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } }),
                                        toolbarPlugin({

                                            toolbarContents: () => (
                                                <>
                                                    <BoldItalicUnderlineToggles />
                                                    <ListsToggle />
                                                    <BlockTypeSelect />
                                                    <CreateLink />
                                                    <InsertCodeBlock />
                                                    <InsertTable />
                                                    <InsertThematicBreak />
                                                </>
                                            ),
                                        }),
                                    ]}
                                />
                                <div className="mt-3">
                                    <button
                                        className="btn btn-primary me-2"
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
