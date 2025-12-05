// schedule-calendar.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

export interface WorkSchedule {
  dateFrom: string | Date;
  confirmed: boolean;
}

@Component({
  selector: "app-schedule-calendar",
  templateUrl: "./schedule-calendar.component.html",
  styleUrls: ["./schedule-calendar.component.scss"],
})
export class ScheduleCalendarComponent implements OnChanges {
  @Input() schedule!: WorkSchedule;
  @Input() title = "Harmonogram pracy";

  @Output() scheduleChange = new EventEmitter<WorkSchedule>();
  @Output() confirm = new EventEmitter<WorkSchedule>();

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    selectable: true,
    selectMirror: true,
    editable: false,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "",
    },
    events: [],
    // użyjemy select, żeby kliknięcie dnia aktualizowało dateFrom
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["schedule"] && this.schedule) {
      this.updateEventsFromSchedule();
    }
  }

  // aktualizacja zdarzeń w kalendarzu na podstawie schedule
  private updateEventsFromSchedule(): void {
    const startDate = this.schedule?.dateFrom
      ? new Date(this.schedule.dateFrom)
      : new Date();

    const color = this.schedule.confirmed ? "green" : "blue";

    this.calendarOptions = {
      ...this.calendarOptions,
      initialDate: startDate,
      events: [
        {
          id: "dateFrom",
          title: this.schedule.confirmed
            ? "Zatwierdzony start"
            : "Proponowany start",
          start: startDate,
          allDay: true,
          color,
        },
      ],
    };
  }

  // Użytkownik zaznaczył dzień na kalendarzu (klik w dzień)
  handleDateSelect(selectInfo: DateSelectArg): void {
    const selectedDate = selectInfo.start;

    const newSchedule: WorkSchedule = {
      ...this.schedule,
      dateFrom: selectedDate,
      confirmed: false, // po zmianie znowu „niezatwierdzona”
    };

    this.schedule = newSchedule;
    this.updateEventsFromSchedule();
    this.scheduleChange.emit(newSchedule);
  }

  // (opcjonalnie) reakcja na kliknięcie eventu
  handleEventClick(arg: EventClickArg): void {
    // np. można tu zrobić toggle confirmed,
    // ale lepiej mieć osobny przycisk "Zatwierdź"
  }

  onConfirm(): void {
    const confirmedSchedule: WorkSchedule = {
      ...this.schedule,
      confirmed: true,
    };

    this.schedule = confirmedSchedule;
    this.updateEventsFromSchedule();
    this.confirm.emit(confirmedSchedule);
  }
}
