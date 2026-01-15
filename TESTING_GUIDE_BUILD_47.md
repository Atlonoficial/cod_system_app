# 🚀 Guia de Teste - BUILD 47

## ✅ Status do Build
- **iOS:** BUILD 47 - Pronto ✅
- **Android:** versionCode 47 - Pronto ✅
- **Build Vite:** Concluído com sucesso ✅
- **Capacitor Sync:** iOS e Android sincronizados ✅

---

## 📱 Como Abrir e Testar

### iOS (Xcode)

#### Opção 1: Abrir via Comando
```bash
cd "c:\Aplicativos - Desenvolvimento Atlon\COOD_SYSTEM\cood_system_app"
npx cap open ios
```

#### Opção 2: Abrir Manualmente
1. Navegue até: `cood_system_app\ios\App`
2. Dê duplo clique em `App.xcworkspace`
3. Aguarde o Xcode abrir

#### No Xcode:
1. Selecione um dispositivo de teste (simulador ou device físico)
2. Clique em **Product** → **Run** (ou pressione `Cmd + R`)
3. Aguarde o build e instalação

---

### Android (Android Studio)

#### Opção 1: Abrir via Comando
```bash
cd "c:\Aplicativos - Desenvolvimento Atlon\COOD_SYSTEM\cood_system_app"
npx cap open android
```

#### Opção 2: Abrir Manualmente
1. Abra o Android Studio
2. Clique em **Open**
3. Navegue até: `cood_system_app\android`
4. Clique em **OK**

#### No Android Studio:
1. Aguarde o Gradle sync terminar
2. Selecione um dispositivo (emulador ou device físico conectado via USB)
3. Clique no botão **Run** (ícone ▶️ verde)
4. Aguarde o build e instalação

---

## 🧪 Checklist de Testes - BUILD 47

### 1. SetLogger (Tela de Exercício)

**Como Testar:**
1. Abra o app
2. Navegue para **Treinos**
3. Selecione qualquer treino
4. Clique em **Iniciar Treino**
5. Observe a tela de registro de série

**O que Validar:**
- [ ] ✅ Nome do exercício aparece no topo (máximo 2 linhas com `...`)
- [ ] ✅ Badge "Série X/Y" aparece à esquerda
- [ ] ✅ "Alvo: X reps" aparece abaixo da badge
- [ ] ✅ No canto superior direito: "Exercício X/Y" e "X%"
- [ ] ✅ Nenhum texto sobrepõe outro
- [ ] ✅ Textos não tocam as bordas laterais

**Título Longo para Testar:**
- Se possível, teste com exercício que tenha nome longo (ex: "Iso Hold Joelho Afundo HD - Step Atrás")

---

### 2. CadastroCompleto (Tela de Cadastro)

**Como Testar:**
1. Abra o app
2. Navegue para **Perfil** (ícone na navbar)
3. Clique em **Cadastro Completo**

**O que Validar:**
- [ ] ✅ Card "Perfil Completo X%" aparece **IMEDIATAMENTE** (sem precisar scroll)
- [ ] ✅ Header tem título "Cadastro Completo" em tamanho adequado
- [ ] ✅ Botão de voltar tem espaço adequado do título
- [ ] ✅ Border sutil separando header do conteúdo
- [ ] ✅ Scroll é suave e natural
- [ ] ✅ Bottom não tem espaço excessivo

**CRÍTICO:**
- A barra de progresso "Perfil Completo" DEVE estar visível sem precisar fazer scroll down!

---

### 3. WorkoutDetail (Detalhes do Treino)

**Como Testar:**
1. Navegue para **Treinos**
2. Clique em qualquer treino (sem iniciar)

**O que Validar:**
- [ ] ✅ Seta de voltar tem espaço adequado do título
- [ ] ✅ Título do treino trunca se for longo (com `...`)
- [ ] ✅ Cards de estatísticas (Duração, Exercícios, Dificuldade, Kcal) têm espaçamento confortável
- [ ] ✅ Grid 2x2 está bem organizado
- [ ] ✅ Nenhum elemento sobrepõe outro

---

## 📸 Screenshots Recomendados

Tire screenshots das seguintes telas para comparação:

### Antes vs Depois:
1. **SetLogger** com exercício de nome longo
2. **CadastroCompleto** mostrando barra de progresso visível
3. **WorkoutDetail** mostrando grid de estatísticas

---

## 🐛 Possíveis Problemas e Soluções

### iOS

**Problema:** "Developer certificate not found"
**Solução:**
1. Xcode → Preferences → Accounts
2. Adicione sua Apple ID
3. Selecione o time correto em Signing & Capabilities

**Problema:** Build falha com erro de provisioning
**Solução:**
1. Selecione o target "App"
2. Vá em Signing & Capabilities
3. Marque "Automatically manage signing"
4. Selecione seu team

---

### Android

**Problema:** "SDK location not found"
**Solução:**
1. Android Studio → File → Project Structure
2. Verifique que SDK Path está configurado
3. Geralmente: `C:\Users\[seu-usuario]\AppData\Local\Android\Sdk`

**Problema:** Gradle sync falha
**Solução:**
1. File → Invalidate Caches / Restart
2. Build → Clean Project
3. Build → Rebuild Project

---

## 📊 Métricas de Sucesso

### Layout Fixes
- [ ] 0 sobreposições de texto
- [ ] 100% dos textos longos truncam corretamente
- [ ] Barra de progresso visível sem scroll em CadastroCompleto
- [ ] Espaçamento consistente em todos os componentes

### Performance
- [ ] App inicia em < 3 segundos
- [ ] Navegação fluida entre telas
- [ ] Scroll suave sem "jumps"

### UX
- [ ] Interface organizada e profissional
- [ ] Títulos legíveis mesmo quando longos
- [ ] Safe areas respeitadas (notch/status bar)

---

## 🎯 Objetivo da Validação

Confirmar que as correções de BUILD 47 resolvem **100%** dos problemas identificados:

1. ✅ SetLogger não sobrepõe título com progresso
2. ✅ CadastroCompleto mostra barra sem scroll
3. ✅ WorkoutDetail tem espaçamento adequado

---

## 📝 Feedback

Após testar, documente:
- ✅ O que funcionou perfeitamente
- ⚠️ O que precisa ajuste
- 🐛 Bugs encontrados
- 💡 Sugestões de melhoria

---

## 🚀 Próximos Passos Após Validação

1. **Se tudo OK:**
   - Deploy para TestFlight (iOS)
   - Deploy para Play Store Internal Testing (Android)
   - Convidar beta testers

2. **Se encontrar problemas:**
   - Documentar com screenshots
   - Criar BUILD 48 com correções adicionais

---

## ⚡ Comandos Rápidos

### Rebuild Completo (se necessário)
```bash
# Limpar build cache
cd "c:\Aplicativos - Desenvolvimento Atlon\COOD_SYSTEM\cood_system_app"

# Rebuild
npm run build

# Sync ambas plataformas
npx cap sync
```

### Abrir IDEs
```bash
# iOS
npx cap open ios

# Android
npx cap open android
```

---

## ✅ Checklist Final

- [x] BUILD 47 configurado (iOS e Android)
- [x] Código compilado com sucesso
- [x] Capacitor sync concluído
- [x] Release notes criadas
- [ ] Teste em dispositivo iOS físico
- [ ] Teste em dispositivo Android físico
- [ ] Screenshots capturados
- [ ] Feedback documentado
- [ ] Deploy para TestFlight/Play Store (se aprovado)

**Status:** 🟢 Pronto para Testes!
