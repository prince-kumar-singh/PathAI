export const readingData = {
    title: "Step 2: Cognitive Reading Assessment",
    passage: {
        title: "The Digital Gallery Event",
        text: "During a college cultural fest, the organizing committee split into smaller groups to manage different parts of the event. One group spent most of their time quietly observing how people moved around the venue—why certain stalls drew larger crowds, why some activities became popular at specific hours, and what patterns explained these changes. Another group focused on the technical setup, dealing with sound systems, projectors, and registration devices. Whenever something stopped working, they immediately came together to test what had gone wrong and fix it before the next performance. The third group was mostly concerned with the look and feel of the event. They arranged decorations, adjusted lighting, designed banners, and made sure every booth looked appealing and easy to navigate. By the end of the day, even though everyone had been part of the same fest, each group felt connected to very different parts of the experience—observing patterns, solving problems, or shaping presentation."
    },
    questions: [
        {
            id: "set1",
            title: "Set 1",
            instruction: "Select 1 (Disagree) to 5 (Agree)",
            type: "slider_group",
            items: [
                { id: "Qpattern1", text: "Q1. I found myself focusing on patterns or behaviours, such as why some stalls became more crowded than others." },
                { id: "Qprobsolve1", text: "Q2. I found myself focusing on technical issues or devices, imagining how I would fix them." },
                { id: "Qmgmt1", text: "Q3. I found myself focusing on the design, appearance, or arrangement of the event." }
            ]
        },
        {
            id: "set2",
            title: "Set 2",
            instruction: "Select 1 (Disagree) to 5 (Agree)",
            type: "slider_group",
            items: [
                { id: "Qpattern2", text: "Q4. I enjoy understanding why something happens by observing behaviour or patterns over time." },
                { id: "Qprobsolve2", text: "Q5. When something stops working, my first instinct is to explore the system and figure out how to fix it." },
                { id: "Qmgmt2", text: "Q6. I care a lot about how things look, and how people experience them visually or interactively." }
            ]
        },
        {
            id: "set3",
            title: "Set 3",
            instruction: "Select the option that best describes you.",
            type: "mcq_group",
            items: [
                {
                    id: "chosenActivity",
                    question: "Which activity feels the most satisfying to you?",
                    options: [
                        "Discovering hidden trends or logical patterns",
                        "Fixing a broken system or solving a technical problem",
                        "Designing or improving the visual and user experience"
                    ]
                },
                {
                    id: "chosenProjWork",
                    question: "If you were given a project in college, which task would you enjoy the most?",
                    options: [
                        "Analyzing data to understand behaviour or predict outcomes",
                        "Building backend logic or solving programming/technical issues",
                        "Designing user interfaces and ensuring smooth interaction"
                    ]
                },
                {
                    id: "chosenTeam",
                    question: "If you were part of the event described above, which team would you naturally join?",
                    options: [
                        "Observation and analysis team",
                        "Technical troubleshooting team",
                        "Design and presentation team"
                    ]
                }
            ]
        },
        {
            id: "set4",
            title: "freeText",
            type: "open_ended",
            instruction: "In a few sentences, explain which part of the event you personally noticed the most, and which you feel you would be most suited for in the event and why it stood out to you.",
            placeholder: "Describe it in your own words, focusing on your thoughts and what you found meaningful."
        }
    ]
};
