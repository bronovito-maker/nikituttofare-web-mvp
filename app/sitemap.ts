import { MetadataRoute } from 'next';
import { fetchSeoData } from '@/lib/seo-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://nikituttofare.com';
    const { cities, services } = await fetchSeoData();

    // 1. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // 2. Hub Routes (Cities) - /rimini, /riccione
    const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
        url: `${baseUrl}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: city.priority,
    }));

    // 3. Spoke Routes (Service in City) - /rimini/idraulico
    let serviceRoutes: MetadataRoute.Sitemap = [];

    // We iterate through all cities and all services to create the matrix
    cities.forEach((city) => {
        services.forEach((service) => {
            serviceRoutes.push({
                url: `${baseUrl}/${city.slug}/${service.slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7, // Function of city priority could be applied here
            });
        });
    });

    return [...staticRoutes, ...cityRoutes, ...serviceRoutes];
}
