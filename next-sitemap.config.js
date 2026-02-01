/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.nikituttofare.com',
    generateRobotsTxt: true,
    exclude: ['/admin', '/admin/*', '/dashboard', '/dashboard/*'],
}
