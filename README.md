# Npgcarteles

La IA de NPG Studio funciona en 4 pasos:

* Subir: el cliente carga una foto de su local y su logo.

* Configurar: elige el tipo de cartel, tamaño, colores e iluminación y también opciones a elegir como corpóreo led, black night, cartelería en polyfan, vinilos y impresión led

* Generar: la IA integra el cartel en la foto para mostrar cómo quedaría de forma realista.

* Descargar: obtiene la simulación en PNG y puede enviar el proyecto por WhatsApp. 2975169780

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://npgcarteles.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5fa76568-be56-5a4d-b50a-9ae377f04780).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Configuración local y Vercel

Copiá .env.example como .env y completá OPENAI_API_KEY y MP_ACCESS_TOKEN. En Vercel, cargá esas mismas variables para Production, Preview y Development. La aplicación usa TanStack Start con Nitro y se despliega desde la raíz del proyecto con 
pm install y 
pm run build.

