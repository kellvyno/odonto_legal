require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// --- LINHAS DE DEPURACAO ADICIONADAS ---
console.log('Conteúdo de process.env.MONGODB_URI antes da conexão:');
console.log(process.env.MONGODB_URI);
// --- FIM DAS LINHAS DE DEPURACAO ---

const { MongoClient } = require('mongodb');
const fs = require('fs').promises; // Importa o módulo 'fs' com promessas para leitura assíncrona de arquivos
const path = require('path'); // Importa o módulo 'path' para resolver caminhos de arquivo

async function importCases() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB Atlas!');

    const database = client.db(process.env.DB_NAME || 'casosPericiais');
    const collection = database.collection('casos');

    // --- LEITURA DO ARQUIVO JSON ---
    const jsonFilePath = path.join(__dirname, 'casos.json'); // Constrói o caminho completo para 'casos.json'
    const jsonData = await fs.readFile(jsonFilePath, 'utf8'); // Lê o arquivo de forma assíncrona
    const casesToInsert = JSON.parse(jsonData); // Converte o conteúdo JSON para um array de objetos JavaScript
    // --- FIM DA LEITURA ---

    // Pré-processa os casos para garantir que a data esteja no formato ISO 8601
    const processedCases = casesToInsert.map(caso => {
      // Verifica se a data existe e não está vazia antes de tentar converter
      if (caso.data) {
        // Tenta criar um objeto Date com a data atual.
        // Se a data já for um formato ISO válido, Date.parse() funcionará.
        // Se for "DD/MM/YYYY", pode precisar de um parse manual mais robusto.
        const dateObj = new Date(caso.data);
        if (!isNaN(dateObj.getTime())) { // Verifica se a data é válida
          caso.data = dateObj.toISOString();
        } else {
          // Fallback para o formato DD/MM/YYYY, se necessário
          const dateParts = caso.data.split('/');
          if (dateParts.length === 3) {
            const [day, month, year] = dateParts;
            const parsedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
            if (!isNaN(parsedDate.getTime())) {
              caso.data = parsedDate.toISOString();
            } else {
              console.warn(`Aviso: Data inválida para conversão ISO em caso "${caso.titulo || 'Sem Título'}": "${caso.data}". Mantendo o formato original.`);
            }
          } else {
            console.warn(`Aviso: Formato de data inesperado em caso "${caso.titulo || 'Sem Título'}": "${caso.data}". Mantendo o formato original.`);
          }
        }
      }
      return caso;
    });

    // Inserir os documentos
    const result = await collection.insertMany(processedCases);
    console.log(`${result.insertedCount} casos inseridos com sucesso!`);

  } catch (error) {
    console.error('Erro ao conectar ou inserir dados:', error);
    // Erros específicos para leitura de arquivo
    if (error.code === 'ENOENT') {
      console.error(`Erro: O arquivo 'casos.json' não foi encontrado em ${path.join(__dirname, 'casos.json')}.`);
      console.error('Certifique-se de que o arquivo "casos.json" está na mesma pasta do script "importCases.js".');
    } else if (error instanceof SyntaxError) {
      console.error(`Erro: O arquivo 'casos.json' contém JSON inválido. Verifique a sintaxe.`);
    }
  } finally {
    await client.close();
    console.log('Conexão com o MongoDB fechada.');
  }
}

importCases();