import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Sidebar from "../components/Sidebar";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getStaticProps() {
  // Получаем список файлов и фильтруем только .md файлы
  const allFiles = fs.readdirSync(CONTENT_DIR);
  const files = allFiles.filter(file => {
    const filePath = path.join(CONTENT_DIR, file);
    return file.endsWith('.md') && fs.statSync(filePath).isFile();
  });

  const topics = files.map((file) => file.replace(/\.md$/, ""));

  // Получаем данные для всех тем
  const topicsData = {};
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContent);
    topicsData[file.replace(/\.md$/, "")] = data;
  }

  return {
    props: {
      topics,
      topicsData,
    },
  };
}

export default function Home({ topics, topicsData }) {
  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Frontend Interview Helper</h1>
      <div className="row">
        <Sidebar topics={topics} topicsData={topicsData} />
        <div className="col-md-9">
          <h3>Выберите тему слева</h3>
        </div>
      </div>
    </div>
  );
}
