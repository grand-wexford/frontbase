import 'bootstrap/dist/css/bootstrap.min.css'; // Импортируем стили Bootstrap
import '../../styles/globals.css'; // Остальные глобальные стили
// import '@mdxeditor/editor/style.css'; // Стили для MDXEditor
import '../styles/code.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}