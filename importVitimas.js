require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// --- LINHAS DE DEPURACAO ---
console.log('Conteúdo de process.env.MONGODB_URI antes da conexão:');
console.log(process.env.MONGODB_URI);
// --- FIM DAS LINHAS DE DEPURACAO ---

const { MongoClient } = require('mongodb');
const fs = require('fs').promises; // Importa o módulo 'fs' com promessas para leitura assíncrona de arquivos
const path = require('path'); // Importa o módulo 'path' para resolver caminhos de arquivo

async function importVitimas() { // Renomeado a função para importVitimas
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB Atlas!');

    const database = client.db(process.env.DB_NAME || 'odontolegal'); // Usa o DB_NAME do .env ou 'odontolegal'
    const collection = database.collection('vitimas'); // <-- Nome da coleção agora é 'vitimas'

    // --- LEITURA DO ARQUIVO JSON ---
    const jsonFilePath = path.join(__dirname, 'vitimas.json'); // <-- Aponta para 'vitimas.json'
    const jsonData = await fs.readFile(jsonFilePath, 'utf8');
    const vitimasToInsert = JSON.parse(jsonData); // Renomeado para vitimasToInsert
    // --- FIM DA LEITURA ---

    // **IMPORTANTE:** Se o seu arquivo vitimas.json tiver campos de data em formato "DD/MM/YYYY" ou similar,
    // você precisará adicionar aqui a lógica de pré-processamento para convertê-los para ISO 8601,
    // assim como fizemos para casos.json. Caso contrário, o MongoDB armazenará como string.
    // Exemplo (se 'dataNascimento' for um campo):
    /*
    const processedVitimas = vitimasToInsert.map(vitima => {
      if (vitima.dataNascimento) {
        const dateParts = vitima.dataNascimento.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          const parsedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
          if (!isNaN(parsedDate.getTime())) {
            vitima.dataNascimento = parsedDate.toISOString();
          }
        }
      }
      return vitima;
    });
    */
    // Por enquanto, assumimos que não há necessidade de conversão de data complexa para as vítimas.
    const processedVitimas = vitimasToInsert; // Sem processamento de data por padrão

    // Inserir os documentos
    const result = await collection.insertMany(processedVitimas);
    console.log(`${result.insertedCount} vítimas inseridas com sucesso!`);

  } catch (error) {
    console.error('Erro ao conectar ou inserir dados:', error);
    if (error.code === 'ENOENT') {
      console.error(`Erro: O arquivo 'vitimas.json' não foi encontrado em ${path.join(__dirname, 'vitimas.json')}.`);
      console.error('Certifique-se de que o arquivo "vitimas.json" está na mesma pasta do script "importVitimas.js".');
    } else if (error instanceof SyntaxError) {
      console.error(`Erro: O arquivo 'vitimas.json' contém JSON inválido. Verifique a sintaxe.`);
    }
  } finally {
    await client.close();
    console.log('Conexão com o MongoDB fechada.');
  }
}

importVitimas(); // Chama a função de importação