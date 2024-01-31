import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = <const>{
    name: "inference",
    parameters: {
        backgroundImage: {
            type: ParameterType.IMAGE,
            pretty_name: 'Background Image',
            default: undefined,
            description: 'The image to be displayed as the background.'
        },
        buttonPositions: {
            type: ParameterType.COMPLEX,
            pretty_name: 'Button Positions',
            default: undefined,
            description: 'The positions of the buttons.'
        },
        agentPosition: {
            type: ParameterType.OBJECT,
            pretty_name: 'Agent Position',
            default: undefined,
            description: 'The position of the agent.'
        },
        prompt: {
            type: ParameterType.HTML_STRING,
            pretty_name: 'Prompt',
            default: null,
            description: 'The HTML content to be displayed as a prompt.'
        }
    },
};

type Info = typeof info;

/**
 * **GI**
 *
 * Goal inference from text
 *
 * @author Lorenss Martinsons
 */
class GIPlugin implements JsPsychPlugin<Info> {
    static info = info;

    private start_time: number;

    constructor(private jsPsych: JsPsych) { }

    trial(display_element: HTMLElement, trial: TrialType<Info>) {
        display_element.innerHTML = ''; // Clear previous content

        // Create and display the background image
        const img = document.createElement('img');
        img.src = trial.backgroundImage;
        let img_data = {
          width: img.width,
          height: img.height
        }
        img.style.position = 'relative';
        img.style.width = img_data.width + "px";
        img.style.height = img_data.height + "px";
        display_element.appendChild(img);

        const promptElement = document.createElement('div');
        promptElement.innerHTML = trial.prompt ? trial.prompt : '';
        display_element.appendChild(promptElement);

        const getPositionStyle = (x, y) => {
            return {
              left: `${(x - 1) * 10}%`,
              top: `${100 - (y) * 10}%`
            };
        };

        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'jspsych-overlay-div'; 
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.width = img_data.width + "px";
        overlayDiv.style.height = img_data.height + "px";
        overlayDiv.style.top = "0";
        overlayDiv.style.left = "calc(50% + 3px)";
        overlayDiv.style.transform = "translateX(-50%)";

        // Append the wrapper div to the stimulus container
        display_element.appendChild(overlayDiv);
        
        for (let i = 0; i < trial.buttonPositions.length; i++) {
            let b = trial.buttonPositions[i];
            let button = document.createElement('button');
            let style = getPositionStyle(b[0], b[1]);
            button.style.left = style.left;
            button.style.top = style.top;
            button.classList.add('gi-image-button');
            button.addEventListener('click', () => this.handleResponse(i));
            overlayDiv.appendChild(button);
        }
        
        const agent = document.createElement('div');
        const agentStyle = getPositionStyle(trial.agentPosition[0], trial.agentPosition[1]);
        agent.style.left = agentStyle.left;
        agent.style.top = agentStyle.top;
        agent.classList.add('gi-image-agent');
        overlayDiv.appendChild(agent);
        
        // Start time for response time tracking
        this.start_time = performance.now();
    }

    handleResponse(buttonIndex) {
        const end_time = performance.now();
        const rt = Math.floor(end_time - this.start_time);

        var trial_data = {
            choice: buttonIndex+1,
            rt: rt
        };

        this.jsPsych.finishTrial(trial_data);
    }
}

export default GIPlugin;
