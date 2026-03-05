export declare const userInputs: {
    contactInfo: {
        name: string;
        titles: string[];
        phone: string;
        location: string;
        email: string;
        links: {
            text: string;
            url: string;
        }[];
    };
    sections: {
        skills: {
            categories: {
                programmingLanguages: {
                    skills: string[];
                };
                frontend: {
                    skills: string[];
                };
                backend: {
                    skills: string[];
                };
                systemDesign: {
                    skills: string[];
                };
                operations: {
                    skills: string[];
                };
                devOps: {
                    skills: string[];
                };
            };
        };
        experiences: ({
            sectionHeader: string;
            position: string;
            company: string;
            website: string;
            dateRange: string;
            skills: string[];
            responsibilities: string[];
            project?: undefined;
        } | {
            sectionHeader: string;
            project: string;
            dateRange: string;
            skills: string[];
            responsibilities: string[];
            position?: undefined;
            company?: undefined;
            website?: undefined;
        })[];
        education: {
            institutions: {
                institution: string;
                credential: string;
                dateRange: string;
            }[];
        };
    };
};
//# sourceMappingURL=dummy.d.ts.map