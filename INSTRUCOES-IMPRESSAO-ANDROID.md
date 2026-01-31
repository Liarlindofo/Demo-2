# 📱 Instruções de Impressão no Android

## ⚠️ Importante: PT-260 e Web Bluetooth

A impressora **PT-260 usa Bluetooth Classic (SPP)**, não Bluetooth Low Energy (BLE). A **Web Bluetooth API do navegador tem limitações** para este tipo de conexão e pode não funcionar corretamente.

## ✅ Solução Recomendada: Usar App OpenLabel

A melhor forma de imprimir no Android é usar o **app OpenLabel** (ou similar) que já está funcionando.

### **Opção 1: Compartilhamento Direto (Recomendado)**

1. No site, clique em **"Imprimir"**
2. Quando aparecer o diálogo de **compartilhamento**, selecione **"OpenLabel"**
3. O app abrirá automaticamente com os dados
4. No app, clique em **"Imprimir"**

### **Opção 2: Download de Arquivo**

1. No site, clique em **"Imprimir"**
2. Um arquivo **.bin** será baixado
3. Abra o app **OpenLabel**
4. No app, importe/abra o arquivo **.bin** baixado
5. Clique em **"Imprimir"**

## 🔧 Por que Web Bluetooth não funciona bem?

- **PT-260 usa Bluetooth Classic (SPP)**, não BLE
- **Web Bluetooth API** foi projetada principalmente para BLE
- **Apps nativos** têm acesso direto às APIs do Android para Bluetooth Classic
- Por isso, apps como OpenLabel funcionam melhor

## 📋 Passo a Passo Detalhado

### **Método 1: Compartilhamento**

1. Preencha os dados da etiqueta no site
2. Clique em **"Imprimir"**
3. Aguarde o diálogo de compartilhamento aparecer
4. Selecione **"OpenLabel"** na lista de apps
5. O app abrirá automaticamente
6. No app, verifique os dados e clique em **"Imprimir"**

### **Método 2: Arquivo .bin**

1. Preencha os dados da etiqueta no site
2. Clique em **"Imprimir"**
3. Um arquivo `.bin` será baixado (formato ESC/POS)
4. Abra o app **OpenLabel**
5. No app, procure a opção de **"Importar"** ou **"Abrir arquivo"**
6. Selecione o arquivo `.bin` baixado
7. Clique em **"Imprimir"**

## 🎯 Qual Método Usar?

- **Compartilhamento**: Mais rápido e direto
- **Arquivo .bin**: Mais confiável se o compartilhamento não funcionar

## ⚠️ Troubleshooting

### **"Compartilhamento não disponível"**
- Verifique se o OpenLabel está instalado
- Tente o método de arquivo .bin

### **"Arquivo não abre no app"**
- Verifique se o app suporta arquivos .bin
- Tente usar outro app de impressão (Print Label, etc.)

### **"App não encontra impressora"**
- Verifique se a impressora está ligada
- Verifique se está pareada no Bluetooth do Android
- Tente re-parear a impressora

## 💡 Dica

Se você usar o app OpenLabel regularmente, pode configurá-lo como **app padrão** para arquivos .bin. Assim, ao baixar o arquivo, ele abrirá automaticamente no app.
