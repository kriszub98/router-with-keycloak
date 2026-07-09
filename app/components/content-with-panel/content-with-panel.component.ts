import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NgClass } from "@angular/common";

@Component({
  selector: "app-content-with-panel",
  standalone: true,
  imports: [NgClass],
  templateUrl: "./content-with-panel.component.html",
  styleUrl: "./content-with-panel.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentWithPanelComponent {
  /**
   * Czy panel boczny jest widoczny.
   */
  panelVisible = input<boolean>(true);

  /**
   * Szerokość panelu bocznego.
   * Może być np. '320px', '400px', '30rem'.
   */
  panelWidth = input<string>("360px");

  /**
   * Po której stronie ma być panel.
   */
  panelPosition = input<"left" | "right">("right");

  /**
   * Czy panel ma mieć obramowanie oddzielające od contentu.
   */
  withBorder = input<boolean>(true);
}
