const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    console.log('🚀 Starting database setup...');
    
    try {
        // First, connect without database to create it
        const connectionWithoutDB = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('🔗 Connected to MySQL server');

        // Create database if not exists
        const dbName = process.env.DB_NAME || 'whatsapp_gateway';
        await connectionWithoutDB.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`📊 Database '${dbName}' created/verified`);
        
        await connectionWithoutDB.end();

        // Now connect to the specific database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName,
            multipleStatements: true
        });

        console.log(`🔗 Connected to database '${dbName}'`);

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'database', 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️  No migrations directory found, skipping migrations');
        } else {
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            console.log(`📋 Found ${migrationFiles.length} migration files`);

            for (const file of migrationFiles) {
                try {
                    console.log(`⚡ Running migration: ${file}`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    
                    // Split SQL by semicolons and execute each statement
                    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
                    
                    for (const statement of statements) {
                        if (statement.trim()) {
                            await connection.execute(statement);
                        }
                    }
                    
                    console.log(`✅ Migration completed: ${file}`);
                } catch (error) {
                    console.error(`❌ Migration failed: ${file}`, error.message);
                    // Continue with other migrations
                }
            }
        }

        // Run seeds
        const seedsDir = path.join(__dirname, 'database', 'seeds');
        if (fs.existsSync(seedsDir)) {
            const seedFiles = fs.readdirSync(seedsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            console.log(`🌱 Found ${seedFiles.length} seed files`);

            for (const file of seedFiles) {
                try {
                    console.log(`🌱 Running seed: ${file}`);
                    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
                    
                    // Split SQL by semicolons and execute each statement
                    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
                    
                    for (const statement of statements) {
                        if (statement.trim()) {
                            await connection.execute(statement);
                        }
                    }
                    
                    console.log(`✅ Seed completed: ${file}`);
                } catch (error) {
                    console.error(`❌ Seed failed: ${file}`, error.message);
                    // Continue with other seeds
                }
            }
        } else {
            console.log('⚠️  No seeds directory found, skipping seeds');
        }

        await connection.end();
        console.log('🎉 Database setup completed successfully!');
        
        // Show next steps
        console.log('\n📋 Next Steps:');
        console.log('   1. Start the application: npm start');
        console.log('   2. Visit API documentation: http://localhost:3000/api/v1/docs');
        console.log('   3. Test health endpoint: http://localhost:3000/health');
        
    } catch (error) {
        console.error('💥 Database setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure MySQL is running');
        console.log('   2. Check database credentials in .env file');
        console.log('   3. Ensure user has CREATE DATABASE privileges');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runMigrations().catch(console.error);
}

module.exports = runMigrations;