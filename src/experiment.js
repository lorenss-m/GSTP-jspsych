/**
 * @title goal inference
 * @description Track moving targets
 * @version 0.1.2
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";
// Plugins
import PreloadPlugin from "@jspsych/plugin-preload";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import ExternalHtmlPlugin from "@jspsych/plugin-external-html";

import InstructionsPlugin from "@jspsych/plugin-instructions";
import HTMLButtonResponsePlugin from "@jspsych/plugin-html-button-response";

import GIPlugin from "./plugins/gi.ts";

import { initJsPsych } from "jspsych";
// Prolific variables
const PROLIFIC_URL = 'https://app.prolific.com/submissions/complete?cc=CRL9VXEZ';
// Trials
import examples from '../assets/examples.json';
import trial_list from '../assets/trial_list.json';

// Define global experiment variables
// REVIEW: add more examples?
const EXAMPLE_TRIAL = examples[0];
const N_TRIALS = trial_list.length;

const BUTTONS = [[4, 3], [4, 6], [4, 9], [8, 2]];
const AGENT = [7, 6];

var EXP_DURATION = 10

const SKIP_PROLIFIC_ID = false;
const SKIP_INSTRUCTIONS = false;


function gen_trial(jspsych, trial_id, scenario, backgroundImage, buttonPositions, agentPosition) {
    let subtl = [];

    let sentence  = "The agent "
    for(let utterance of scenario) { 
        sentence += utterance

        prompt = "The agent starts on the orange circle. Press one of the green goals, based on the following information: <br> <b>" + sentence + "</b>"
        console.log(agentPosition);
        let gi_trial = {
                type: GIPlugin,
                backgroundImage: backgroundImage,
                buttonPositions: buttonPositions,
                agentPosition: agentPosition,
                prompt: prompt
            };
        subtl.push(gi_trial);
        sentence += ", ";
    }
    const tl = {
        timeline: subtl,
        data: {
            trial_id: trial_id
        }
    };
    return tl;
};

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {

    const jsPsych = initJsPsych({
        show_progress_bar: true,
        on_finish: () => {
            if (typeof jatos !== 'undefined') {
                // in jatos environment
                jatos.endStudyAndRedirect(PROLIFIC_URL, jsPsych.data.get().json());
            } else {
                return jsPsych;
            };
        }
    });

    const timeline = [];

    const env_img = assetPaths.images[0];

    // Consent
    timeline.push({
        type: ExternalHtmlPlugin,
        // HACK: This could change based on file names under `assets`
        url: assetPaths.misc[0],
        cont_btn: 'start',
        check_fn: function() {
            if (document.getElementById('consent_checkbox').checked) {
                return true;
            } else {
                alert('You must tick the checkbox to continue with the study.')
            }
        }
    });

    // Prolific ID
    if (!SKIP_PROLIFIC_ID) {
        timeline.push({
            type: SurveyTextPlugin,
            questions: [{
                prompt: 'Please enter your Prolific ID',
                required: true
            }],
            data: {
                type: "prolific_id",
            }
        });
    };

    // Preload assets
    timeline.push({
        type: PreloadPlugin,
        images: assetPaths.images,
        audio: assetPaths.audio,
        video: assetPaths.video,
    });

    // Welcome screen
    timeline.push({
        type: InstructionsPlugin,
        pages: [
            `<h1>Hi, welcome to our study!</h1><br><br> ` +
            `Please take a moment to adjust your seating so that you can comfortably watch the monitor and use the keyboard/mouse.<br> ` +
            `Feel free to dim the lights as well.  ` +
            `Close the door or do whatever is necessary to minimize disturbance during the experiment. <br> ` +
            `Please also take a moment to silence your phone so that you are not interrupted by any messages mid-experiment. ` +
            `<br><br> ` +
            `Click <b>Next</b> when you are ready to calibrate your display. `,
        ],
        show_clickable_nav: true,
        allow_backward: false,
        data: {
            type: "welcome",
        }
    });

    // Switch to fullscreen
    timeline.push({
        type: FullscreenPlugin,
        fullscreen_mode: true,
    });

    const instruct_tl = [];
    instruct_tl.push({
        type: InstructionsPlugin,
        pages: [
            `The study is designed to be <i>challenging</i>. <br> ` +
            ` Sometimes, you'll be certain about the answer. <br>` +
            `Other times, you won't be -- and this is okay!<br>` +
            `Just give your best guess each time. <br><br>` +
            `Click <b>Next</b> to continue.`,

            `We know it is also difficult to stay focused for so long, especially when you are doing the same` +
            `thing over and over.<br> But remember, the experiment will be all over in less than ${EXP_DURATION} minutes.` +
            ` There are <strong>${N_TRIALS} trials</strong> in this study. <br>` +
            `Please do your best to remain focused! ` +
            ` Your responses will only be useful to us if you remain focused. <br><br>` +
            `Click <b>Next</b> to continue.`,

            "In this task, you will see an agent telling you about its way to a goal<br>" +
            "At the beginning of each task, you will see <b>4</b> " +
            "goals highlighted as squares in <span style='color:green'>GREEN</span> " +
            "and an agent starting position as a circle in <span style='color:orange'>ORANGE</span>.<br>" +
            "Also, you will see a sentence describing the agent's movement. " +
            "The sentence will describe, in steps, the actions the agent has taken, " +
            "and your main task is to decide which of the 4 goals the agent is moving to. <br>",
            
            `The sentence will be revealed in a set of utterances, and you will get a better idea of the goal after each utterance.<br>` +
            `After each utterance, you must indicate which goal you think the agent is moving to.<br>` +
            `The next utterance will be displayed after you select a goal.<br>` +
            `These utterances often might be nonsensical, and that is by design - try to use all the information given to determine the most likely option. If you find yourself guessing, that is okay, give it your best go!<br>` +
            "Click <b>Next</b> to give it a try.",
        ],
        show_clickable_nav: true,
        // show_page_number: true,
        page_label: "<b>Instructions</b>",
        allow_backward: false,
    });

    let agent_example = [7, 5];

    instruct_tl.push(gen_trial(jsPsych, 0, EXAMPLE_TRIAL, env_img, BUTTONS, agent_example));

    // comprehension check
    const comp_check = {
        type: SurveyMultiChoicePlugin,
        preamble: "<h2>Comprehension Check</h2> " +
            "<p> Before beginning the experiment, you must answer a few simple questions to ensure that the instructions are clear." +
            "<br> If you do not answer all questions correctly, you will be returned to the start of the instructions.</p>",
        questions: [{
            prompt: "Which of the following is <b>TRUE</b>",
            name: 'check1',
            options: [
                "A) The targets are indicated with an orange circle",
                "B) The targets will remain visible throughout the whole trial",
                "C) The targets will move around the screen in a random pattern",
            ],
            required: true
        },
        {
            prompt: " Which of the following statements is <b>TRUE</b>:",
            name: 'check2',
            options: [
                "A) You should maintain an arm-length distance from your monitor",
                "B) You should listen to audio instructions while performing the task",
                "C) You should click one of the goals after each utterance"
            ],
            required: true
        },
        ],
        randomize_question_order: false,
        on_finish: function(data) {
            const q1 = data.response.check1[0];
            const q2 = data.response.check2[0];
            // both comp checks must pass
            data.correct = (q1 == 'B' && q2 == 'C');
        },
        data: {
            type: "comp_quiz",
        }
    };

    // feedback
    const comp_feedback = {
        type: HTMLButtonResponsePlugin,
        stimulus: () => {
            var last_correct_resp = jsPsych.data.getLastTrialData().values()[0].correct;
            var msg;
            if (last_correct_resp) {
                msg = "<h2><span style='color:green'>You passed the comprehension check!</span>" +
                    "<br>When you're ready, please click <b>Next</b> to begin the study. </h2>";
            } else {
                msg = "<h2><span style='color:red'>You failed to respond <b>correctly</b> to all" +
                    " parts of the comprehension check.</span> <br>Please click <b>Next</b> to revisit the instructions.</h2>"
            }
            return msg
        },
        choices: ['Next'],
        data: {
            // add any additional data that needs to be recorded here
            type: "comp_feedback",
        }
    };

    // `comp_loop`: if answers are incorrect, `comp_check` will be repeated until answers are correct responses
    const comp_loop = {
        timeline: [...instruct_tl, comp_check, comp_feedback],
        loop_function: function(data) {
            // return false if comprehension passes to break loop
            // HACK: changing `timeline` will break this
            const vals = data.values();
            const quiz = vals[vals.length - 2];
            return (!(quiz.correct));
        }
    };

    // add comprehension loop
    if (!SKIP_INSTRUCTIONS) {
        timeline.push(comp_loop);
    };

    // add exp trials with random shuffle, unique per session
    for (let i = 0; i < trial_list.length; i++) {
        // for (const trial of trial_list) {
        timeline.push(gen_trial(jsPsych, i+1, trial_list[i], env_img, BUTTONS, AGENT));
        if (i < trial_list.length - 1) {
            timeline.push({
                type: HTMLButtonResponsePlugin,
                stimulus: `Good job! This is the end of task ${i+1}. Press Next to continue to the next task.`,
                choices: ['Next'],
                data: {
                    type: "wait",
                }
            });
        }
    };


    // debriefing
    timeline.push({
        type: SurveyTextPlugin,
        preamble: `<h2><b>Thank you for helping us with our study! ` +
            `We value your responses. </b></h2><br><br> ` +
            `Please fill out the (optional) survey below and click <b>Done</b> to complete the experiment. <br> `,
        questions: [
            {
                prompt: 'Did you find yourself using any strategies while performing the task?',
                name: 'Strategy', rows: 5, placeholder: 'None'
            },

            {
                prompt: "Are there any additional comments you'd like to add? ",
                name: 'General', rows: 5, placeholder: 'None'
            }
        ],
        button_label: 'Done'
    });

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
