# 🚗 Cadê Minha Vaga

App feito com **React Native + Expo** para você salvar onde estacionou o carro e encontrar
de volta com a rota. Arquitetura **MVC** com banco de dados local **SQLite**.

## 📁 Estrutura (MVC)

```
CadeMinhaVaga/
├── App.js                      # Bootstrap: navegação + inicialização dos controllers
├── app.json                    # Config Expo (permissões de localização, plugins)
├── src/
│   ├── models/                 # MODELO - dados e banco local
│   │   ├── database.js         # Abertura do expo-sqlite + criação do schema
│   │   └── ParkingModel.js     # CRUD das vagas + distância (Haversine)
│   ├── controllers/            # CONTROLLER - regras de GPS e estado
│   │   ├── LocationController.js   # Permissões, posição atual, tracking, rotas
│   │   └── ParkingController.js    # Estado global (observable) + regras de vaga
│   └── views/                  # VIEW - telas
│       ├── HomeScreen.js       # Status + botões "SALVAR VAGA" / "VER ROTA"
│       ├── SaveSpotScreen.js   # Mapa + botão gigante "SALVAR VAGA"
│       ├── RouteScreen.js      # Mapa + botão gigante "VER ROTA" (app de mapas)
│       ├── components/BigButton.js
│       └── theme.js
```

## 📦 Dependências principais

- `expo-location` → permissão e leitura do GPS
- `@maplibre/maplibre-react-native` → mapa OpenStreetMap (`Map`, `Marker`, `Camera`, `Layer`) — **gratuito e sem API key**
- `expo-sqlite` → banco local (`parking_spots`)
- `@react-navigation/native` + `native-stack` → navegação entre telas

## ▶️ Como rodar

```bash
cd CadeMinhaVaga
npm install        # já feito durante o setup
npx expo start     # escaneie o QR code com o app Expo Go
```

- Android: `npx expo start` → leia o QR code no **Expo Go** (play store)
- iOS: use a câmera do iPhone para o QR code (Expo Go)
- ⚠️ **Telas com mapa exigem build nativo** (o MapLibre não roda no Expo Go):
  gere um APK com `npx eas build -p android --profile preview` ou use
  `npx expo run:android` com o emulador/dispositivo conectado.

## ⚠️ Avisos importantes

1. **Permissão de localização**: o app pede acesso à localização *enquanto em uso*
   na primeira abertura. Sem ela, não é possível salvar nem traçar rotas.
2. **Mapa 100% sem chave de API**: o app usa MapLibre + tiles do OpenStreetMap
   (`src/views/mapStyle.js`). Não é preciso criar chave no Google Cloud nem
   habilitar faturamento — se um dia quiser trocar o estilo, edite apenas
   `OSM_MAP_STYLE`.
3. **Rota externa**: o botão "VER ROTA" abre o Apple Maps (iOS) ou Google Maps (Android)
   com a rota a pé até a vaga salva.
4. O banco `cade_minha_vaga.db` é local e persiste entre sessões (SQLite via `expo-sqlite`).

## 🔧 Solução de problemas

### Botão "USAR MINHA LOCALIZAÇÃO ATUAL" falha / alerta de GPS
O app tenta, nesta ordem: **GPS de alta precisão → precisão balanceada → última posição conhecida**.
Se falhar tudo, o alerta mostra o motivo exato (o mesmo fica no cartão "Status do GPS" da Home).

1. Confirme que a **permissão de localização** foi concedida (botão "PERMITIR LOCALIZAÇÃO" ou "ABRIR AJUSTES DO APARELHO" dentro da tela Salvar).
2. **Emulador Android**: abra os *Extended Controls* (⋯) → aba **Location** → defina um ponto ("Set location"). Sem Google Play Services/localização simulada o GPS não retorna nada.
3. **Simulador iOS**: *Features* → *Location* → *Custom Location*.
4. **Celular real**: ative o GPS em *Modo Alta precisão* e tente com sinal (em local fechado o fix demora).

### Mapa vazio / cinza
- Confirme que o aparelho tem **internet** (os tiles do OpenStreetMap são baixados online).
- O MapLibre **não roda no Expo Go** — se testar lá, as telas de mapa não
  carregam. Gere um APK (`eas build`) ou rode `npx expo run:android`.

### App fecha ao abrir a tela de mapa (build antigo com Google Maps)
Builds anteriores usavam `react-native-maps` sem API key, o que derrubava o
app no Android. Essa causa foi eliminada ao migrar para MapLibre/OSM — gere
um novo APK para aplicar a correção.

### Web (`npm run web`)
`@maplibre/maplibre-react-native` e o `expo-location` não rodam no navegador — use o **Expo Go** (celular) ou emulador/build nativo.

## 🧪 Validação

- `npx expo export --platform android` → gera o bundle de produção (confere imports/sintaxe)
- `npx expo-doctor` → verifica compatibilidade das dependências com o SDK 57
