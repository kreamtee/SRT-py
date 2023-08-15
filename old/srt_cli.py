import argparse
import srt

def motd():
    print("[ SRT Reservation & Monitoring Program by @Kream ]")
    print()
    print("* This program is exclusively designed for parsing SRT schedule data and making reservations.")
    print("* By using this program, you assume all responsibility for its actions.")
    print("* DO NOT use it as a macro, for activities that violate guidelines, or for spamming.")
    print()

def usage():
    print("Usage:")
    print("  srt.py [subcommands] [flags]")
    print()
    print("Commands:")
    print("  srt.py -h : Display this usage message.")
    print("  srt.py -l : List all SRT schedules by -n, -D, -d, -a.")
    print("  srt.py -s : List available seats by -n, -D, -d, -a, -c")
    print("  srt.py -r : Interactively make an SRT reservation by -n, -D, -d, -a")
    print("  srt.py -p : Non-interactively make an SRT reservation by -n, -D, -d, -a")
    print("  srt.py -m : Monitor availability for SRT by -n, -D, -d, -a, -c")
    print()
    print("Flags:")
    print("  -n : Train Number")
    print("  -D : Date (in the format YYYYMMDD)")
    print("  -H : Hour (used as a reference when searching for trains by number; Optional)")
    print("  -d : Departure Station Code")
    print("  -a : Arrival Station Code")
    print("  -c : Class (Normal: 0, First: 1)")
    print()

def main():
    parser = argparse.ArgumentParser(description="SRT Reservation & Monitoring Program by Kream")
    subparsers = parser.add_subparsers(dest='command')
   
    parser_list = subparsers.add_parser('l', help="List all SRT schedules") 
    parser_seats = subparsers.add_parser('s', help="List available seats")

    parser_reserve_i = subparsers.add_parser('i', help="Make an SRT reservation (Interactive)")
    parser_reserve = subparsers.add_parser('r', help="Make an SRT reservation")
    parser_monitor = subparsers.add_parser('m', help="Monitor availability for SRT")

    for subparser in [parser_list, parser_seats, parser_reserve_i, parser_reserve, parser_monitor]:
        subparser.add_argument('-D', help="Date (in the format YYYYMMDD)", required=True, dest="date")
        subparser.add_argument('-d', help="Departure Station Code", required=True, dest="deptStn")
        subparser.add_argument('-a', help="Arrival Station Code", required=True, dest="arrvStn")
    
    for subparser in [parser_seats, parser_reserve_i, parser_reserve, parser_monitor]:
        subparser.add_argument('-n', help="Train Number", required=True, dest="trnNo")
       
    parser_list.add_argument('-H', help="Hour to search", required=True, dest="hour")
        
    for subparser in [parser_seats, parser_monitor]:
        subparser.add_argument('-H', help="Hour to search", required=False, dest="hour", default=0)
        subparser.add_argument('-c', help="Class (Normal: 1, First: 2)", choices=["1", "2"], required=False, dest="grade", default=0)

    args = parser.parse_args()

    if args.command == 'l':
        if not all([args.date, args.deptStn, args.arrvStn, args.hour]):
            parser_list.print_help()
            exit()
        srt.printTrainInfo(srt.getTrainSechedule(int(args.deptStn), int(args.arrvStn), args.date, int(args.hour)))
   
    elif args.command == 's':
        if not all([args.date, args.deptStn, args.arrvStn, args.trnNo]):
            parser_list.print_help()
            exit()

        if not all([args.hour]):
            args.hour = 0

        # print(args)
        print(f"Finding #{int(args.trnNo)} in {args.date} for {int(args.deptStn)}->{int(args.arrvStn)}...")
        if train := srt.findTrainfromId(int(args.trnNo), args.date, int(args.deptStn), int(args.arrvStn), int(args.hour)):
            print("Found!\n")
            srt.printTrainInfo(train)
            if not args.grade or args.grade == 1:
                print("\nNormal-class")
                srt.printSeatInfo(seats := srt.getSeatInfo(train, "normal"))

            if not args.grade or args.grade == 2:
                print("\nFirst-class")
                srt.printSeatInfo(seats_first := srt.getSeatInfo(train, "first"))
                print()
        else:
            print("Not Found. Try Again..")

    elif args.command == 'r':
        if not all([args.trnNo, args.date, args.deptStn, args.arrvStn]):
            parser_list.print_help()
            exit()

        if not all([args.hour]):
            args.hour = 0
   
    elif args.command == 'm':
        if not all([args.date, args.deptStn, args.arrvStn, args.trnNo]):
            parser_list.print_help()
            exit()

   
    else:
        motd()
        srt.printStations()
        parser.print_help()

if __name__ == "__main__":
    main()