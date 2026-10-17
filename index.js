const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

const colorsConfig = {
    red: colors.red,
    green: colors.green,
    blue: colors.blue,
    cyan: colors.cyan,
    reset: colors.reset
};

class DiscordScraper {
    constructor() {
        this.BADGES = {
            [1 << 0]: "<:Badge_Discord_Staff:1365704725646807060>",
            [1 << 1]: "<:DiscordPartner:1365700977570742312>",
            [1 << 2]: "<:HypeSquadEvents:1365704359454834770>",
            [1 << 3]: "<:BugHunter1:1365701008184967278>",
            [1 << 9]: "<:86964earlysupporter:1345831325738995848>",
            [1 << 14]: "<:BugHunter2:1365701027830960259>",
            [1 << 17]: "<:dev:1365704127103107112>",
            [1 << 18]: "<:ModeratorProgramsAlumni:1365701046256533525>",
        };

        this.seenUsers = new Set();
        this.totalProcessed = 0;
        this.isScanning = false;
        this.config = this.loadConfig();

        this.client = new Client({
            checkUpdate: false
        });
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (!fs.existsSync(configPath)) {
                throw new Error('config.json dosyası bulunamadı');
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (!config.token || !config.webhook || config.commandChannel === undefined) {
                throw new Error('config.json eksik alanlar içeriyor (token, webhook, commandChannel)');
            }
            return config;
        } catch (error) {
            console.error(colorsConfig.red(`Config yükleme hatası: ${error.message}`));
            process.exit(1);
        }
    }

    displayBanner() {
        const kaanseasColors = [colors.red, colors.green, colors.yellow, colors.blue, colors.magenta, colors.cyan, colors.white];
        const kaanseasText = [
            "██╗  ██╗ █████╗ █████╗ ███╗   ██╗███████╗███████╗ █████╗ ███████╗",
            "██║ ██╔╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔════╝██╔══██╗██╔════╝",
            "█████╔╝ ███████║███████║██╔██╗ ██║███████╗█████╗  ███████║███████╗",
            "██╔═██╗ ██╔══██║██╔══██║██║╚██╗██║╚════██║██╔══╝  ██╔══██║╚════██║",
            "██║  ██╗██║  ██║██║  ██║██║ ╚████║███████║███████╗██║  ██║███████║",
            "╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝"
        ];
        kaanseasText.forEach((line, idx) => {
            console.log(kaanseasColors[idx % kaanseasColors.length](line));
        });
    }

    async sendToWebhook(content) {
        try {
            const response = await axios.post(this.config.webhook, {
                content: content,
                username: "Kaanseas Badge Scrapper",
                avatar_url: "https://avatars.githubusercontent.com/u/126435851?v=4"
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return { success: true, status: response.status };
        } catch (error) {
            return {
                success: false,
                status: error.response?.status || 0,
                error: error.message
            };
        }
    }

    async sendStartupGuide() {
        const guideMessage = 
            `**Kaanseas Badge Scrapper Aktif Edildi!**\n\n` +
            `Bot başarıyla başlatıldı ve komut dinlemeye başladı.\n\n` +
            `**Nasıl Kullanılır?**\n` +
            `• Botu çalıştırmak için Discord üzerinde **<#${this.config.commandChannel}>** kanalına gitmelisin.\n` +
            `• Sohbete şu komutu yazarak taramayı başlatabilirsin:\n` +
            `> \`!hq <sunucu-id>\`\n\n` +
            `**Örnek Kullanım:**\n` +
            `> \`!hq 123456789012345678\``;

        await this.sendToWebhook(guideMessage);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scanGuild(guildId) {
        if (this.isScanning) {
            console.log(colorsConfig.yellow('Şu anda zaten bir tarama yapılıyor, lütfen bitmesini bekleyin.'));
            return;
        }

        this.isScanning = true;
        this.seenUsers.clear();
        this.totalProcessed = 0;

        try {
            console.log(colorsConfig.cyan('Sunucu bilgileri alınıyor...'));
            const guild = await this.client.guilds.fetch(guildId);
            
            console.log(colorsConfig.cyan(`Sunucu bulundu: ${guild.name}. Doğrudan üye havuzu çekiliyor...`));
            
            try {
                await Promise.race([guild.members.fetch(), this.delay(6000)]);
            } catch (e) {
                // Zaman aşımı toleransı
            }

            const members = guild.members.cache;
            console.log(colorsConfig.green(`Üye havuzu hazır! Toplam ${members.size} üye işleniyor...`));

            let webhookQueue = [];
            let currentMessage = "";

            for (const [memberId, member] of members) {
                const user = member.user;
                const userId = user.id;

                if (this.seenUsers.has(userId)) continue;
                this.seenUsers.add(userId);
                
                const flags = user.flags?.bitfield || user.public_flags || 0;

                let badges = Object.keys(this.BADGES)
                    .map(bit => parseInt(bit))
                    .filter(bit => flags & bit)
                    .map(bit => this.BADGES[bit])
                    .join('');

                if (!badges) {
                    if (user.username.length === 2) {
                        badges = "<:2L:1388122321033629789>";
                    } else if (user.username.length === 3) {
                        badges = "<:3L:1388122363953942550>";
                    } else {
                        continue;
                    }
                }

                const line = `> ** ${userId} - ${user.username}** <@${userId}> **Rozet:** ${badges}\n`;

                if (currentMessage.length + line.length > 1900) {
                    webhookQueue.push(currentMessage);
                    currentMessage = line;
                } else {
                    currentMessage += line;
                }

                this.totalProcessed++;
            }

            if (currentMessage.length > 0) {
                webhookQueue.push(currentMessage);
            }

            console.log(colorsConfig.cyan(`\nİşlem tamamlandı. Webhook'a aktarılıyor (${webhookQueue.length} parça)...`));

            for (const msg of webhookQueue) {
                await this.sendToWebhook(msg);
                await this.delay(100);
            }

            console.log(colorsConfig.green(`\nScraping başarıyla tamamlandı!`));
            console.log(colorsConfig.cyan(`Rozetli/Özel tagli işlenen kullanıcı: ${this.totalProcessed}`));
            console.log(colorsConfig.cyan(`Toplam taranan benzersiz kullanıcı: ${this.seenUsers.size}`));

        } catch (error) {
            console.error(colorsConfig.red(`Tarama sırasında hata oluştu: ${error.message}`));
        } finally {
            this.isScanning = false;
        }
    }

    async run() {
        console.clear();
        this.displayBanner();

        this.client.once('ready', async () => {
            console.log(colorsConfig.green(`Bot olarak giriş yapıldı: ${this.client.user.tag}`));
            
            if (this.config.commandChannel) {
                console.log(colorsConfig.cyan(`Komut bekleniyor... ${this.config.commandChannel} kanalına '!hq sunucu-id' yazabilirsiniz.`));
                // Bot açıldığında webhook'a bilgilendirme/kılavuz mesajı gönder
                await this.sendStartupGuide();
                console.log(colorsConfig.green(`Kılavuz mesajı webhook adresine gönderildi!`));
            } else {
                console.log(colorsConfig.red(`DİKKAT: config.json içinde 'commandChannel' boş!`));
            }
        });

        this.client.on('messageCreate', async (message) => {
            if (!this.config.commandChannel || message.channel.id !== this.config.commandChannel) return;
            
            if (message.content.startsWith('!hq ')) {
                const args = message.content.trim().split(/ +/);
                const targetGuildId = args[1];

                if (!targetGuildId) {
                    console.log(colorsConfig.red('Geçersiz komut kullanımı. Örnek: !hq sunucu-id'));
                    return;
                }

                console.log(colorsConfig.green(`\nKomut algılandı! Hedef Sunucu ID: ${targetGuildId}`));
                await this.scanGuild(targetGuildId);
            }
        });

        try {
            await this.client.login(this.config.token);
        } catch (error) {
            console.error(colorsConfig.red(`Discord'a bağlanılamadı: ${error.message}`));
            process.exit(1);
        }
    }
}

async function main() {
    const scraper = new DiscordScraper();
    await scraper.run();
}

if (require.main === module) {
    main();
}

module.exports = DiscordScraper;