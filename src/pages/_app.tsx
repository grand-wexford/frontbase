import 'bootstrap/dist/css/bootstrap.min.css'; // Импортируем стили Bootstrap
import '../../styles/globals.css'; // Остальные глобальные стили

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}