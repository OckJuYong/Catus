#!/usr/bin/env python3
"""
Catus Backend Session State Updater
세션이 끊겨도 작업 내역을 기억할 수 있도록 상태를 저장합니다.

Usage:
    python update_session.py --task "Implemented Gemini API integration"
    python update_session.py --phase "Phase 3" --status "In Progress"
    python update_session.py --note "Need to get Gemini API key"
    python update_session.py --next "Implement emotion analysis"
    python update_session.py --issue "Docker container keeps stopping"
"""

import json
import argparse
import sys
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

SESSION_FILE = Path(__file__).parent / ".catus_session.json"


def load_session():
    """Load current session state"""
    if SESSION_FILE.exists():
        with open(SESSION_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_session(data):
    """Save session state"""
    data['last_updated'] = datetime.now().isoformat()
    with open(SESSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Session state updated: {SESSION_FILE}")


def main():
    parser = argparse.ArgumentParser(description='Update Catus session state')
    parser.add_argument('--task', help='Mark task as completed')
    parser.add_argument('--current', help='Update current task')
    parser.add_argument('--phase', help='Update current phase')
    parser.add_argument('--status', help='Update current status')
    parser.add_argument('--next', help='Add next step')
    parser.add_argument('--issue', help='Add blocking issue')
    parser.add_argument('--note', help='Update notes')
    parser.add_argument('--docker', choices=['running', 'stopped'], help='Docker status')
    parser.add_argument('--build', choices=['success', 'failed'], help='Build status')
    parser.add_argument('--show', action='store_true', help='Show current state')

    args = parser.parse_args()

    session = load_session()

    # Show current state
    if args.show:
        print(json.dumps(session, indent=2, ensure_ascii=False))
        return

    # Update session
    updated = False

    if args.task:
        if 'completed_tasks' not in session:
            session['completed_tasks'] = []
        session['completed_tasks'].append(args.task)
        session['session_number'] = session.get('session_number', 0) + 1
        updated = True
        print(f"✅ Completed task: {args.task}")

    if args.current:
        session['current_task'] = args.current
        updated = True
        print(f"🔄 Current task: {args.current}")

    if args.phase:
        session['current_phase'] = args.phase
        updated = True
        print(f"📍 Phase: {args.phase}")

    if args.status:
        session['current_status'] = args.status
        updated = True
        print(f"📊 Status: {args.status}")

    if args.next:
        if 'next_steps' not in session:
            session['next_steps'] = []
        session['next_steps'].append(args.next)
        updated = True
        print(f"➡️  Next step added: {args.next}")

    if args.issue:
        if 'blocking_issues' not in session:
            session['blocking_issues'] = []
        session['blocking_issues'].append({
            'issue': args.issue,
            'reported_at': datetime.now().isoformat()
        })
        updated = True
        print(f"⚠️  Issue added: {args.issue}")

    if args.note:
        session['notes'] = args.note
        updated = True
        print(f"📝 Note: {args.note}")

    if args.docker:
        if 'environment_status' not in session:
            session['environment_status'] = {}
        session['environment_status']['docker_running'] = args.docker == 'running'
        updated = True
        print(f"🐳 Docker: {args.docker}")

    if args.build:
        if 'environment_status' not in session:
            session['environment_status'] = {}
        session['environment_status']['build_status'] = args.build.upper()
        session['environment_status']['last_build'] = datetime.now().isoformat()
        updated = True
        print(f"🔨 Build: {args.build}")

    if updated:
        save_session(session)
    else:
        print("No updates provided. Use --help to see available options.")


if __name__ == '__main__':
    main()
