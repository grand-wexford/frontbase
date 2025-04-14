---
title: HTML
subtopics:
  - Теги
  - Семантика
  - Атрибуты
  - Формы
  - Мультимедиа
  - SEO
  - Accessibility (доступность)
---

# Введение в HTML

HTML (HyperText Markup Language) — это стандартный язык разметки для документов, предназначенных для отображения в веб-браузере.
***

## Теги

HTML-теги являются основными строительными блоками веб-страниц:
* **Структурные**: `<html>`, `<head>`, `<body>`
* **Текстовые**: `<p>`, `<h1>`-`<h6>`, `<span>`, `<div>`
* **Ссылки и якоря**: `<a href="#">`
* **Списки**: `<ul>`, `<ol>`, `<li>`
* **Таблицы**: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>`
* **Формы**: `<form>`, `<input>`, `<textarea>`, `<select>`, `<button>`
* **Мультимедиа**: `<img>`, `<audio>`, `<video>`, `<source>`
***

## Семантика

Семантические теги улучшают читаемость кода и помогают поисковым системам:

| Тег         | Назначение                          |
| ----------- | ----------------------------------- |
| `<header>`  | Верхняя часть страницы или секции   |
| `<nav>`     | Основная навигация                  |
| `<main>`    | Основное содержимое                 |
| `<section>` | Раздел контента                     |
| `<article>` | Независимый блок (например, статья) |
| `<aside>`   | Боковая информация, ссылки          |
| `<footer>`  | Нижняя часть страницы               |

***

## Атрибуты

Атрибуты расширяют функциональность тегов:

- **global**: `id`, `class`, `style`, `title`, `data-*`
- **для ссылок**: `href`, `target="_blank"`
- **для изображений**: `src`, `alt`, `width`, `height`
- **для форм**: `type`, `name`, `value`, `placeholder`, `required`

```html
<a href="https://example.com" target="_blank">Ссылка</a>
<input type="text" placeholder="Введите имя" required>
```
***

## Формы

Формы позволяют собирать данные от пользователя:

```html
<form>
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>
  <button type="submit">Отправить</button>
</form>
```

Популярные типы `<input>`: `text`, `email`, `password`, `checkbox`, `radio`, `number`, `file`, `submit`.

***

## Мультимедиа

Добавление изображений, аудио и видео:

```html
<img src="image.jpg" alt="Описание">
<video controls>
  <source src="video.mp4" type="video/mp4">
</video>
```

- `alt` — важен для доступности и SEO.
- `controls` — отображает элементы управления.

***

## SEO (поисковая оптимизация)

HTML влияет на индексацию:

- Используйте `<title>` и `<meta name="description">`
- Применяйте семантические теги (`<article>`, `<section>`, `<h1>`)
- Добавляйте `alt` для изображений
- Используйте "чистую" структуру заголовков (не пропускайте `<h1>`, `<h2>`, и т.д.)

***

## Accessibility (доступность)

Доступность улучшает взаимодействие для пользователей с ограниченными возможностями:

- `alt` для `<img>`
- `label` для элементов формы
- Атрибуты: `aria-label`, `role`, `tabindex`
- Семантические теги улучшают навигацию с клавиатуры и screen reader'ами

```html
<button aria-label="Закрыть">×</button>
```
***

# Полезные ссылки

- [MDN Web Docs — HTML](https://developer.mozilla.org/ru/docs/Web/HTML)
- [HTML Validator](https://validator.w3.org/)