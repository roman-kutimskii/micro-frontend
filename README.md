# Микрофронтенд-приложение на Vite + React

Этот репозиторий демонстрирует архитектуру микрофронтенда с использованием Vite, React и Module Federation. Приложение состоит из двух независимых приложений:

- **`host/`** — хост-приложение (оболочка), которое загружает и использует компоненты из удалённого микрофронтенда
- **`remote/`** — удалённый микрофронтенд, который экспортирует компонент `Greeting` для использования в хосте

## Общий поток работы приложения

### 1. Инициализация хоста

При запуске хоста происходит следующее:

1. **Точка входа**: [`host/src/main.tsx`](host/src/main.tsx) — создаёт React-приложение и монтирует компонент `App` в DOM
2. **Хост-оболочка**: [`host/src/App.tsx`](host/src/App.tsx) — основной компонент хоста, который:
   - Использует `React.lazy()` для асинхронной загрузки компонента из удалённого микрофронтенда
   - Оборачивает загрузку в `Suspense` для отображения состояния загрузки
   - Передаёт пропсы в удалённый компонент

### 2. Загрузка удалённого микрофронтенда

Когда хост пытается импортировать `remote/Greeting`:

1. **Module Federation** (настроен в [`host/vite.config.ts`](host/vite.config.ts)) перехватывает импорт
2. Загружается `remoteEntry.js` с удалённого сервера (в разработке: `http://localhost:5001/assets/remoteEntry.js`)
3. Из `remoteEntry.js` извлекается экспортированный модуль `./Greeting`
4. Компонент рендерится внутри хоста

### 3. Экспорт компонента из remote

Удалённый микрофронтенд:

1. **Точка входа**: [`remote/src/main.tsx`](remote/src/main.tsx) — создаёт собственное приложение (для автономной разработки)
2. **Экспортируемый компонент**: [`remote/src/Greeting.tsx`](remote/src/Greeting.tsx) — компонент, который экспортируется через Module Federation
3. **Конфигурация экспорта**: [`remote/vite.config.ts`](remote/vite.config.ts) — настраивает, какие модули доступны для хоста

## Архитектура микрофронтенда

### Технологический стек

- **Vite** — инструмент сборки и dev-сервер
- **React 18** — UI-библиотека
- **@originjs/vite-plugin-federation** — плагин для Module Federation в Vite
- **TypeScript** — типизация

### Структура проекта

```
micro-frontend/
├── host/                    # Хост-приложение
│   ├── src/
│   │   ├── main.tsx         # Точка входа хоста
│   │   ├── App.tsx          # Основной компонент хоста
│   │   ├── remote.d.ts      # TypeScript-типы для удалённого модуля
│   │   └── ...
│   └── vite.config.ts       # Конфигурация Module Federation (потребитель)
│
└── remote/                  # Удалённый микрофронтенд
    ├── src/
    │   ├── main.tsx         # Точка входа remote (для автономной разработки)
    │   ├── App.tsx          # Локальное приложение remote
    │   ├── Greeting.tsx     # Экспортируемый компонент
    │   └── ...
    └── vite.config.ts       # Конфигурация Module Federation (провайдер)
```

### Загрузка и инициализация микрофронтендов

#### Конфигурация хоста (потребитель)

В [`host/vite.config.ts`](host/vite.config.ts) настроен Module Federation как **потребитель**:

```typescript
federation({
  name: 'host',
  remotes: {
    remote: remoteEntryUrl  // URL для загрузки remoteEntry.js
  },
  shared: ['react', 'react-dom']  // Общие зависимости
})
```

**Ключевые моменты:**
- `remotes` определяет, откуда загружать удалённые модули
- `remoteEntryUrl` указывает на `remoteEntry.js` (в продакшене: `/remote/assets/remoteEntry.js`, в разработке: `http://localhost:5001/assets/remoteEntry.js`)
- `shared` указывает, что `react` и `react-dom` должны быть общими между хостом и remote (предотвращает дублирование)

#### Конфигурация remote (провайдер)

В [`remote/vite.config.ts`](remote/vite.config.ts) настроен Module Federation как **провайдер**:

```typescript
federation({
  name: 'remote',
  filename: 'remoteEntry.js',  // Имя файла точки входа
  exposes: {
    './Greeting': './src/Greeting.tsx'  // Экспорт компонента
  },
  shared: ['react', 'react-dom']
})
```

**Ключевые моменты:**
- `filename` — имя файла, который будет сгенерирован при сборке
- `exposes` — карта экспортируемых модулей (ключ — путь для импорта, значение — путь к исходному файлу)
- При сборке создаётся `remoteEntry.js`, который содержит экспортированные модули

#### Процесс загрузки

1. **Импорт в хосте**: [`host/src/App.tsx`](host/src/App.tsx) использует динамический импорт:
   ```typescript
   const RemoteGreeting = lazy(() => import('remote/Greeting'));
   ```

2. **TypeScript-типы**: [`host/src/remote.d.ts`](host/src/remote.d.ts) предоставляет типы для TypeScript:
   ```typescript
   declare module 'remote/Greeting' {
     import { ComponentType } from 'react';
     const Component: ComponentType<{ hostName?: string }>;
     export default Component;
   }
   ```

3. **Ленивая загрузка**: `React.lazy()` загружает модуль только при первом рендере компонента

4. **Обработка загрузки**: `Suspense` отображает fallback во время загрузки:
   ```typescript
   <Suspense fallback={<p>Loading remote greeting...</p>}>
     <RemoteGreeting hostName="Host shell" />
   </Suspense>
   ```

### Коммуникация между хостом и микрофронтендом

#### Передача данных через пропсы

В текущей реализации коммуникация происходит **односторонне** — от хоста к remote через пропсы:

- **Хост передаёт данные**: [`host/src/App.tsx`](host/src/App.tsx) передаёт проп `hostName`:
  ```typescript
  <RemoteGreeting hostName="Host shell" />
  ```

- **Remote принимает данные**: [`remote/src/Greeting.tsx`](remote/src/Greeting.tsx) получает пропсы:
  ```typescript
  export default function Greeting({ hostName = 'remote shell' }: GreetingProps)
  ```

#### Общие зависимости (Shared Dependencies)

Module Federation обеспечивает **общий runtime** для общих зависимостей:

- **Конфигурация**: В обоих [`host/vite.config.ts`](host/vite.config.ts) и [`remote/vite.config.ts`](remote/vite.config.ts) указано:
  ```typescript
  shared: ['react', 'react-dom']
  ```

- **Результат**: React и ReactDOM загружаются один раз и используются обоими приложениями, что:
  - Уменьшает размер бандла
  - Предотвращает конфликты версий
  - Обеспечивает единый контекст React

### Роутинг и жизненный цикл (mount/unmount)

#### Текущая реализация

В данной реализации **роутинг отсутствует** — это простое демо с одним компонентом. Однако жизненный цикл компонентов управляется React:

1. **Mount**: Когда `RemoteGreeting` впервые рендерится, React.lazy загружает модуль и монтирует компонент
2. **Unmount**: Если компонент удаляется из дерева (например, через условный рендеринг), React автоматически размонтирует его

#### Расширение для роутинга

Для добавления роутинга можно использовать:
- **React Router** в хосте для навигации между страницами
- **Условный рендеринг** для монтирования/размонтирования разных микрофронтендов
- **Динамические импорты** для загрузки микрофронтендов по требованию

Пример расширения:
```typescript
// В host/src/App.tsx можно добавить:
const RemoteGreeting = lazy(() => import('remote/Greeting'));
const RemoteDashboard = lazy(() => import('remote/Dashboard'));

// И условно рендерить:
{route === '/greeting' && <RemoteGreeting />}
{route === '/dashboard' && <RemoteDashboard />}
```

### Доступ к общим сервисам и глобальному состоянию

#### Текущая реализация

В текущей версии **нет явного глобального состояния или общих сервисов**. Однако Module Federation позволяет:

1. **Экспортировать утилиты из remote**: Можно добавить в [`remote/vite.config.ts`](remote/vite.config.ts):
   ```typescript
   exposes: {
     './Greeting': './src/Greeting.tsx',
     './utils': './src/utils.ts'  // Экспорт утилит
   }
   ```

2. **Использовать в хосте**: [`host/src/App.tsx`](host/src/App.tsx) может импортировать:
   ```typescript
   import { someUtil } from 'remote/utils';
   ```

#### Рекомендации для расширения

Для управления глобальным состоянием можно использовать:

- **Context API** — если состояние нужно только в React-компонентах
- **События** — `window.postMessage` или кастомные события для межприложенной коммуникации
- **Общий модуль состояния** — экспортировать store (Redux, Zustand и т.д.) через Module Federation
- **Props drilling** — передавать состояние через пропсы (как сейчас с `hostName`)

## Быстрый старт

### Требования

- Node.js 18+
- npm

### Установка и запуск

1. **Установите зависимости**:
   ```bash
   npm install
   ```

2. **Запустите удалённый микрофронтенд** (терминал 1):
   ```bash
   cd remote
   npm install
   npm run dev -- --host --port 5001
   ```

3. **Запустите хост-приложение** (терминал 2):
   ```bash
   cd host
   npm install
   npm run dev -- --host --port 5000
   ```

4. **Откройте браузер**: [http://localhost:5000](http://localhost:5000)

Хост автоматически загрузит компонент `Greeting` с удалённого сервера по адресу [http://localhost:5001/assets/remoteEntry.js](http://localhost:5001/assets/remoteEntry.js).

### Сборка для продакшена

```bash
# Сборка remote (создаёт remoteEntry.js)
npm --prefix remote run build

# Сборка host
npm --prefix host run build
```

Для предпросмотра:
```bash
npm --prefix remote run preview
npm --prefix host run preview
```

## Границы микрофронтенда

### Чёткие границы

1. **Хост (`host/`)**: 
   - Независимое приложение, может работать автономно
   - Загружает и оркестрирует удалённые компоненты
   - Управляет общим UI и навигацией

2. **Remote (`remote/`)**:
   - Независимое приложение, может работать автономно (см. [`remote/src/App.tsx`](remote/src/App.tsx))
   - Экспортирует компоненты через Module Federation
   - Имеет собственные стили и логику

### Точки интеграции

- **Импорт в хосте**: [`host/src/App.tsx:4`](host/src/App.tsx#L4) — `import('remote/Greeting')`
- **Экспорт в remote**: [`remote/vite.config.ts:30-32`](remote/vite.config.ts#L30-L32) — `exposes: { './Greeting': ... }`
- **TypeScript-типы**: [`host/src/remote.d.ts`](host/src/remote.d.ts) — определение типов для удалённого модуля

### Общие ресурсы

- **Зависимости**: React и ReactDOM разделяются через `shared` в конфигурации
- **Стили**: Каждый микрофронтенд имеет свои CSS-файлы (изоляция стилей не настроена, но возможна через CSS Modules или Shadow DOM)

## Навигация по кодовой базе

### Ключевые файлы для понимания архитектуры

#### Хост-приложение
- [`host/src/main.tsx`](host/src/main.tsx) — точка входа, инициализация React
- [`host/src/App.tsx`](host/src/App.tsx) — основной компонент, загрузка remote-компонента
- [`host/vite.config.ts`](host/vite.config.ts) — конфигурация Module Federation (потребитель)
- [`host/src/remote.d.ts`](host/src/remote.d.ts) — TypeScript-типы для удалённых модулей

#### Удалённый микрофронтенд
- [`remote/src/main.tsx`](remote/src/main.tsx) — точка входа для автономной разработки
- [`remote/src/Greeting.tsx`](remote/src/Greeting.tsx) — экспортируемый компонент
- [`remote/vite.config.ts`](remote/vite.config.ts) — конфигурация Module Federation (провайдер)
- [`remote/src/App.tsx`](remote/src/App.tsx) — локальное приложение для тестирования

#### Конфигурация проекта
- [`package.json`](package.json) — скрипты для управления обоими приложениями
- [`host/package.json`](host/package.json) — зависимости хоста
- [`remote/package.json`](remote/package.json) — зависимости remote

## Развёртывание

### GitHub Pages

Проект настроен для развёртывания на GitHub Pages через GitHub Actions. Переменная окружения `BASE_PATH` должна соответствовать имени репозитория для корректного разрешения путей к ассетам.

### Локальное тестирование продакшен-сборки

```bash
# Замените <repo> на имя вашего репозитория
BASE_PATH=<repo> npm --prefix remote run build -- --outDir dist/remote
BASE_PATH=<repo> npm --prefix host run build
```

Удалённая сборка должна быть доступна по пути `/remote/remoteEntry.js` относительно корня сайта.

## Дополнительные ресурсы

- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [@originjs/vite-plugin-federation](https://github.com/originjs/vite-plugin-federation)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
