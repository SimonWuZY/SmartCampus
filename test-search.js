// 简单的测试脚本
const testQuery = "请你为我检索一下所有可能的高等数学学习笔记";

fetch('http://localhost:3000/api/test-article-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: testQuery })
})
.then(response => response.json())
.then(data => {
  console.log('测试结果:');
  console.log('- 查询:', data.query);
  console.log('- 文章总数:', data.articlesCount);
  console.log('- 是否触发搜索:', data.shouldSearch);
  console.log('- 搜索结果数:', data.searchResults?.length || 0);
  
  if (data.searchResults && data.searchResults.length > 0) {
    console.log('\n找到的文章:');
    data.searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   作者: ${result.author}`);
      console.log(`   标签: ${result.label}`);
      console.log(`   相关度: ${Math.round(result.score * 100)}%`);
      console.log(`   匹配关键词: ${result.matchedKeywords.join(', ')}`);
      console.log('');
    });
  }
})
.catch(error => {
  console.error('测试失败:', error);
});