export const userInputs = {
    contactInfo: {
        name: "John Gray",
        titles: ["Software Engineer", "Full Stack Developer"],
        phone: "9146724526",
        location: "New York, NY",
        email: "johngraydev@gmail.com",
        links: [
            {
                text: "LinkedIn",
                url: "https://www.linkedin.com/in/john-thomas-gray/",
            },
            { text: "GitHub", url: "https://github.com/john-thomas-gray" },
            { text: "Portfolio", url: "https://johngraydev.com" },
        ],
    },
    sections: {
        skills: {
            categories: {
                programmingLanguages: {
                    skills: ["JavaScript", "TypeScript", "Python", "C#"],
                },
                frontend: {
                    skills: ["React", "Angular", "Vue", "Svelte", "Next.js"],
                },
                backend: {
                    skills: [
                        "Node.js",
                        "Express",
                        "Django",
                        "Flask",
                        "MongoDB",
                        "MySQL",
                        "PostgreSQL",
                    ],
                },
                systemDesign: {
                    skills: [
                        "Design Patterns",
                        "Microservices",
                        "Event-Driven Architecture",
                        "API Design",
                        "RESTful APIs",
                        "GraphQL",
                    ],
                },
                operations: {
                    skills: [
                        "Linux",
                        "Windows",
                        "macOS",
                        "Docker",
                        "Kubernetes",
                        "CI/CD",
                        "Git",
                    ],
                },
                devOps: {
                    skills: [
                        "Agile",
                        "Project Management",
                        "Scrum",
                        "Jira",
                        "Consumer Research",
                        "Business Development",
                    ],
                },
            },
        },
        experiences: [
            {
                sectionHeader: "Professional Experience",
                position: "Full Stack Developer Volunteer",
                company: "Change Climate Project",
                website: "changeclimate.org",
                dateRange: "Jun '24 - Present",
                skills: [
                    "React",
                    "Node.js",
                    "TypeScript",
                    "CI/CD",
                    "Cypress",
                    "Python",
                    "Chakra UI",
                ],
                responsibilities: [
                    "Contribute to and maintain a production application with dynamic UI using React and Chakra UI.",
                    "Ensure code quality and reliability with unit and component testing (Jest) as well as end-to-end testing (Cypress).",
                    "Use Jira to facilitate Scrum practices with a distributed team in an Agile environment, working proactively for fast turnover.",
                ],
            },
            {
                sectionHeader: "Professional Experience",
                position: "Software Engineer",
                company: "Wadjet LLC",
                website: "wadjet.com",
                dateRange: "Apr '20 - Present",
                skills: ["React", "Node.js", "MongoDB", "Express"],
                responsibilities: [
                    "Developed and maintained web applications using React, Node.js, and MongoDB.",
                    "Built and maintained scalable and efficient APIs using Node.js and Express.",
                    "Implemented new features and improvements to existing codebases.",
                    "Collaborated with cross-functional teams to deliver high-quality software solutions.",
                ],
            },
            {
                sectionHeader: "Relevant Projects",
                project: "Tell - Audio Description Delivery Synced with Theatre Management Systems",
                dateRange: "Jun '25",
                skills: [
                    "React Native",
                    "Node.js",
                    "TypeScript",
                    "MySQL",
                    "Expo",
                    "Tailwind",
                ],
                responsibilities: [
                    "Built a custom audio player that interfaces with theatres' systems to dynamically sync AV and restrict playback to screening times.",
                    "Architected a relational DB integrated with Google Maps, Places, and TMDB to randomly generate realistic TMS schedules.",
                    "Prioritized blind users by designing accessibility-first UI/UX features.",
                    "Used a Tailwind/PostCSS pipeline for consistency across platforms.",
                ],
            },
            {
                sectionHeader: "Relevant Projects",
                project: "Booky - Book Club & Social Media Betting Platform",
                dateRange: "May '24",
                skills: [
                    "React",
                    "TypeScript",
                    "pytest",
                    "PostgreSQL",
                    "FastAPI",
                    "Docker",
                ],
                responsibilities: [
                    "Architected a Dockerized full-stack application with modular backend routers, JWT auth, and relational database modeling.",
                    "Implemented asynchronous programming to craft a fun betting system that positively reinforces user participation.",
                    "Tested backend with pytest + FastAPI TestClient and enforced formatting/linting with Black, ESLint, and Prettier.",
                    "Built REST APIs and consumed external services (Google Books API), with robust validation, error handling, and injection safeguards.",
                ],
            },
            {
                sectionHeader: "Relevant Projects",
                project: "4Sight - Mobile Game Engine & App",
                dateRange: "Jan '26",
                skills: [
                    "React Native",
                    "TypeScript",
                    "Jest",
                    "Expo SDK",
                    "RN Reanimated",
                ],
                responsibilities: [
                    "Integrated a modular game engine and downloadable extras using provider-based state management and slice hooks.",
                    "Orchestrated modular asynchronous RN Reanimated animations.",
                    "Persisted game and settings state with AsyncStorage.",
                    "Implemented component-level tests (Jest + @testing-library/react-native) and ensured a scalable architecture for iOS.",
                ],
            },
        ],
        education: {
            institutions: [
                {
                    institution: "College of the Holy Cross",
                    credential: "Bachelor of Arts in English",
                    dateRange: "Sep '12 - May '15",
                },
                {
                    institution: "Hack Reactor",
                    credential: "Full Stack Software Engineering Immersive Program",
                    dateRange: "May '24",
                },
            ],
        },
    },
};
//# sourceMappingURL=dummy.js.map