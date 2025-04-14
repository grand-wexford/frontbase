import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Sidebar({ topics, topicsData, currentTopic, currentSubtopic }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const router = useRouter();

  const createPage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          parentTopic: selectedParent || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsCreating(false);
        setNewTitle("");
        setNewContent("");
        setSelectedParent("");

        // Показываем сообщение о перенаправлении
        setIsRedirecting(true);

        // Проверяем существование страницы перед перенаправлением
        let maxAttempts = 10;
        let pageExists = false;

        while (maxAttempts > 0 && !pageExists) {
          try {
            const checkResponse = await fetch(data.path);
            if (checkResponse.ok) {
              pageExists = true;
            } else {
              await new Promise(resolve => setTimeout(resolve, 500));
              maxAttempts--;
            }
          } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 500));
            maxAttempts--;
          }
        }

        if (pageExists) {
          router.push(data.path);
        } else {
          alert('Ошибка: страница не была создана');
        }
      } else {
        alert("Ошибка при создании страницы");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("Ошибка при создании страницы");
    } finally {
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  return (
    <>
      <aside className="col-sm-2 col-md-2 col-lg-2 bg-light p-4 border-end">
        <div className="position-sticky top-0">
          <h2 className="h5 mb-4">Темы</h2>
          <ul className="list-unstyled mb-3">
            {topics.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/${topic}`}
                  className={`d-block p-2 rounded ${topic === currentTopic ? 'bg-secondary text-white' : 'hover:bg-light'
                    }`}
                >
                  {topic}
                </Link>

                {topicsData[topic]?.subtopics && topicsData[topic].subtopics.length > 0 && (
                  <ul className="ms-3 mt-2 list-unstyled">
                    {topicsData[topic].subtopics.map((subtopic, index) => (
                      <li key={index}>
                        <Link
                          href={`/${topic}/${subtopic}`}
                          className={`d-block p-2 rounded ${topic === currentTopic && subtopic === currentSubtopic
                            ? 'bg-secondary text-white'
                            : 'hover:bg-light'
                            }`}
                        >
                          {subtopic}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary w-100"
            onClick={() => setIsCreating(true)}
          >
            Добавить страницу
          </button>
        </div>
      </aside>

      {isCreating && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {isRedirecting && (
            <div className="position-fixed top-0 start-0 w-100 bg-info text-white py-2 text-center" style={{ zIndex: 1100 }}>
              Страница создана, перенаправление...
            </div>
          )}
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Создание новой страницы</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTitle("");
                    setNewContent("");
                    setSelectedParent("");
                  }}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Заголовок</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Родительский раздел (необязательно)</label>
                  <select
                    className="form-select"
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                  >
                    <option value="">Создать как основной раздел</option>
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Содержание</label>
                  <textarea
                    className="form-control"
                    rows={10}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTitle("");
                    setNewContent("");
                    setSelectedParent("");
                  }}
                >
                  Отмена
                </button>
                <button
                  className="btn btn-success"
                  onClick={createPage}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Создание...
                    </>
                  ) : (
                    "Создать"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
