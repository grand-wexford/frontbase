import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Sidebar from "../components/Sidebar";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getStaticProps() {
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

  return {
    props: {
      topics,
      topicsData,
    },
  };
}

interface TopicData {
  title?: string;
  subtopics?: string[];
}

interface TopicsData {
  [key: string]: TopicData;
}

interface HomeProps {
  topics: string[];
  topicsData: TopicsData;
}

export default function Home({ topics, topicsData }: HomeProps) {
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
