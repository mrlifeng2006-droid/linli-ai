const { initDatabase, query, queryOne, execute, closeDatabase } = require('./dist/core/database');

async function debug() {
  await initDatabase();
  
  console.log('=== 调试数据库 ===');
  
  // 检查 Merchant 表
  const merchantCount = query('SELECT COUNT(*) as count FROM Merchant');
  console.log('Merchant 数量:', merchantCount[0].count);
  
  if (merchantCount[0].count > 0) {
    const merchants = query('SELECT id, phone, nickname FROM Merchant');
    console.log('Merchant 列表:', merchants);
  }
  
  // 测试 queryOne
  const phone = '13800138000';
  const existing = await queryOne('SELECT id FROM Merchant WHERE phone = ?', [phone]);
  console.log(`查询手机号 ${phone}:`, existing);
  
  await closeDatabase();
}

debug();
