# Projeto Escopo - Mobile

Aplicativo da plataforma de levantamento de requisitos, Escopo, como Trabalho de Conclusão de Curso (TCC) no curso de Desenvolvimento de Sistemas no SENAI.

O app mobile permite que o usuário acesse e gerencie os projetos em que participa diretamente pelo celular.

## Sobre o projeto

O sistema foi desenvolvido com o objetivo de centralizar todo o levantamento de requisitos de projetos, permitindo:

- Autenticação de usuários
- Gerenciamento de projetos
- Criação, edição e versionamento de documentos
- Criação de registros
- Documentação de reuniões entre o time e clientes

Este repositório contém exclusivamente o aplicativo mobile da aplicação.

## Tecnologias utilizadas

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind (Tailwind CSS para React Native)
- React Hook Form
- Zod
- Axios
- AsyncStorage

## Estrutura de pastas

```sql
src/
├── app/         -- Telas e rotas da aplicação (Expo Router)
├── assets/      -- Arquivos estáticos (imagens, fontes, etc.)
├── components/  -- Componentes reutilizáveis da interface
├── constants/   -- Valores constantes usados em vários lugares (variáveis de ambiente, chaves de storage, etc.)
├── contexts/    -- Contextos globais para compartilhamento de estado
├── hooks/       -- Hooks customizados reutilizáveis
├── schemas/     -- Schemas de validação e tipagem (Zod)
├── services/    -- Comunicação externa (ex.: APIs)
└── utils/       -- Funções auxiliares reutilizadas em diversos arquivos
```

## Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Node.js 22 ou superior
- npm 10 ou superior
- Android Studio (para Android)

## Como executar o projeto

### 1. Inicie o back-end, seguindo o passo-a-passo [nesse repositório](https://github.com/zNathan2303/projeto-escopo-api)

### 2. Clone este repositório:

```bash
git clone https://github.com/AndreRT77/projeto-escopo-mobile
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configurar o `.env`

Para Mac sendo:

```.env
EXPO_PUBLIC_API_URL='http://10.0.2.2:8080'
```

E Windows sendo o Endereço IPv4 da máquina, obtido rodando o comando `ipconfig` no PowerShell.
Exemplo:

```.env
EXPO_PUBLIC_API_URL='http://192.168.0.4:8080'
```

### 5. Inicie o app

```bash
npx expo start
```

### 6. Configure o emulador de IOS/Android, vendo o passo-a-passo [aqui](https://docs.expo.dev/get-started/set-up-your-environment/).

### 7. Acesse o respectivo dispositivo usado no emulador.

## Repositórios relacionados

Frontend:

- https://github.com/Samys003/projeto-escopo-web

Banco de dados:

- https://github.com/EdvanOAlves/projeto-escopo-db

## Equipe

- [Nathan](https://www.linkedin.com/in/nathandasilvacosta/) - Backend e Mobile
- [Edvan](https://www.linkedin.com/in/edvan-alves/) - Banco de dados e Frontend
- [Samara](https://www.linkedin.com/in/samara-santos-b92160397/) - Frontend
- [André](https://www.linkedin.com/in/andr%C3%A9-roberto-tavares-03a36b316/) - Frontend e Mobile
