import { Component } from "@angular/core";

@Component({
  moduleId: module.id,
  selector: "repl",
  templateUrl: "../html/repl.component.html",
  styleUrls: [ "../styles/repl.component.css" ]
})
export class REPLComponent {

  command: Command = new Command(1)

  results: Command[] = [
  ]

  onSubmit() {
    let toExec = this.command;
    this.command = new Command(toExec.num + 1);
    toExec.run();
    this.results.unshift(toExec);
  }
}

export class Command {
  text: string;
  result: string;
  num: number;

  constructor(num: number) {
    this.text = "";
    this.result = "";
    this.num = num;
  }

  run() {
    try {
      this.result = eval(this.text).toString();
    } catch (e) {
      this.result = e;
    }
  }
}