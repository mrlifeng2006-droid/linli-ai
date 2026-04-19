/**
 * 清理测试数据脚本
 */
const { initDatabase, execute, query, closeDatabase } = require('./core/database');

async function clearTestData() {
  try {
    await initDatabase();
    
    // 删除所有测试数据（保留表结构）
    await execute('DELETE FROM Merchant');
    await execute('DELETE FROM Merchant_Profile');
    await execute('DELETE FROM SMS_Code');
    await execute('DELETE FROM Wechat_Bind');
    await execute('DELETE FROM Auth_Log');
    await execute('DELETE FROM Points_Log');
    
    console.log('✅ 测试数据已清空');
    
    // 显示剩余记录数
    const tables = ['Merchant', 'Merchant_Profile', 'SMS_Code', 'Wechat_Bind'];
    for (const table of tables) {
      const result = query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result[0].count} 条记录`);
    }
    
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('❌ 清理失败:', err.message);
    process.exit(1);
  }
}

clearTestData();
